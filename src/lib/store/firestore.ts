import { FieldValue, type Firestore, type Timestamp } from "firebase-admin/firestore";
import type { Question, QuestionPaper, StudentPaper } from "@/lib/quiz/types";
import { averageScore, paperKeys, resultDocId, toStudentPaper, type ResultRecord } from "./records";

// Firestore 읽기·쓰기를 모은 곳입니다. 서버에서만 호출하고, 권한 확인은 부르는 쪽(서버 창구)에서 먼저 합니다.
// papers/{자동번호}: 문제지(정답·해설 포함), results/{문제지+이름}: 이름별 최신 완료 결과

const PAPERS = "papers";
const RESULTS = "results";

type PaperDoc = {
  title: string;
  titleKey: string;
  contentHash: string;
  questions: Question[];
  questionCount: number;
  published: boolean;
  fileName: string;
  source?: "json" | "pdf-ai";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type TeacherPaperRow = {
  id: string;
  title: string;
  questionCount: number;
  published: boolean;
  createdAt: string;
};

export type ResultRow = Pick<ResultRecord, "studentName" | "score" | "correctCount" | "total" | "wrongQuestions"> & {
  completedAt: string;
};

const iso = (t: Timestamp | undefined) => t?.toDate().toISOString() ?? "";

export async function listPapersForTeacher(db: Firestore): Promise<TeacherPaperRow[]> {
  const snap = await db.collection(PAPERS).get();
  return snap.docs
    .map((d) => {
      const p = d.data() as PaperDoc;
      return { id: d.id, title: p.title, questionCount: p.questionCount, published: p.published, createdAt: iso(p.createdAt) };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type CreatePaperResult = { ok: true; id: string } | { ok: false; reason: "duplicate-title" | "duplicate-content"; title: string };

/** 제목이나 내용이 같은 문제지가 이미 있으면 저장하지 않습니다. JSON 업로드는 비공개, AI 생성본은 바로 공개로 저장합니다. */
export async function createPaper(
  db: Firestore,
  input: { title: string; questions: Question[]; fileName: string; published?: boolean; source?: "json" | "pdf-ai" },
): Promise<CreatePaperResult> {
  const { titleKey, contentHash } = paperKeys(input.title, input.questions);
  const papers = db.collection(PAPERS);

  return db.runTransaction(async (tx) => {
    const sameTitle = await tx.get(papers.where("titleKey", "==", titleKey).limit(1));
    if (!sameTitle.empty) return { ok: false, reason: "duplicate-title", title: sameTitle.docs[0].get("title") };
    const sameContent = await tx.get(papers.where("contentHash", "==", contentHash).limit(1));
    if (!sameContent.empty) return { ok: false, reason: "duplicate-content", title: sameContent.docs[0].get("title") };

    const ref = papers.doc();
    tx.create(ref, {
      title: input.title.trim(),
      titleKey,
      contentHash,
      questions: input.questions,
      questionCount: input.questions.length,
      published: input.published ?? false,
      fileName: input.fileName,
      source: input.source ?? "json",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  });
}

/** 공개 상태를 바꿉니다. 문제지가 없으면 false. */
export async function setPublished(db: Firestore, paperId: string, published: boolean): Promise<boolean> {
  try {
    await db.collection(PAPERS).doc(paperId).update({ published, updatedAt: FieldValue.serverTimestamp() });
    return true;
  } catch (e) {
    if ((e as { code?: number }).code === 5) return false; // 문서 없음
    throw e;
  }
}

/** 학생 목록용: 공개된 문제지만, 정답·해설을 뺀 채로 돌려줍니다. */
export async function listPublishedPapers(db: Firestore): Promise<StudentPaper[]> {
  const snap = await db.collection(PAPERS).where("published", "==", true).get();
  return snap.docs
    .map((d) => {
      const p = d.data() as PaperDoc;
      return { createdAt: iso(p.createdAt), paper: toStudentPaper({ id: d.id, title: p.title, questions: p.questions }) };
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((x) => x.paper);
}

/** 채점용: 공개된 문제지를 정답과 함께 읽습니다. 없거나 비공개면 null. */
export async function getPublishedPaper(db: Firestore, paperId: string): Promise<QuestionPaper | null> {
  const snap = await db.collection(PAPERS).doc(paperId).get();
  const p = snap.data() as PaperDoc | undefined;
  if (!p || !p.published) return null;
  return { id: snap.id, title: p.title, questions: p.questions };
}

/** 같은 문제지·같은 이름의 이전 결과는 최신 완료 결과로 덮어씁니다. */
export async function saveResult(db: Firestore, record: ResultRecord): Promise<void> {
  await db
    .collection(RESULTS)
    .doc(resultDocId(record.paperId, record.studentName))
    .set({ ...record, completedAt: FieldValue.serverTimestamp() });
}

export async function getPaperResults(
  db: Firestore,
  paperId: string,
): Promise<{ title: string; questionCount: number; rows: ResultRow[]; average: number | null } | null> {
  const paper = await db.collection(PAPERS).doc(paperId).get();
  if (!paper.exists) return null;

  const snap = await db.collection(RESULTS).where("paperId", "==", paperId).get();
  const rows = snap.docs
    .map((d) => {
      const r = d.data();
      return {
        studentName: r.studentName,
        score: r.score,
        correctCount: r.correctCount,
        total: r.total,
        wrongQuestions: r.wrongQuestions,
        completedAt: iso(r.completedAt),
      } as ResultRow;
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "ko"));

  return {
    title: paper.get("title"),
    questionCount: paper.get("questionCount"),
    rows,
    average: averageScore(rows.map((r) => r.score)),
  };
}
