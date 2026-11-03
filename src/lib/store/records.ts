import { createHash } from "node:crypto";
import { calcScore, gradeQuiz } from "../quiz/grade";
import type { GradeResult, Question, QuestionPaper, StudentPaper } from "../quiz/types";
import { normalizeStudentName } from "../student/name";

// Firestore에 저장하는 모양을 만들고 검사하는 순수 로직입니다(Firestore 없이 자동 점검 가능).

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

export const MAX_NAME_LENGTH = 30;

/** 제목 중복 확인용 열쇠. 공백·대소문자를 무시합니다. */
export const titleKey = (title: string) => title.trim().replace(/\s+/g, " ").toLowerCase();

/** 중복 확인용 열쇠. 제목은 공백·대소문자를 무시하고, 내용은 문항 전체가 같은지 봅니다. */
export function paperKeys(title: string, questions: Question[]) {
  return {
    titleKey: titleKey(title),
    contentHash: sha256(JSON.stringify(questions)),
  };
}

/** 풀이 중 학생에게 보낼 문제지. 정답과 해설을 뺍니다. */
export function toStudentPaper(paper: QuestionPaper): StudentPaper {
  return {
    id: paper.id,
    title: paper.title,
    questions: paper.questions.map(({ question, options }) => ({ question, options })),
  };
}

/** 같은 문제지·같은 이름이면 같은 문서 번호가 되어, 다시 풀면 최신 결과로 덮어씁니다. */
export function resultDocId(paperId: string, studentName: string): string {
  return sha256(`${paperId}\n${studentName}`);
}

export type Submission = { paperId: string; studentName: string; answers: number[] };

/** 학생이 보낸 최종 제출 내용을 검사합니다. 문항 수와 맞는지는 문제지를 읽은 뒤 checkAnswers로 봅니다. */
export function parseSubmission(body: unknown): { ok: true; value: Submission } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "제출 내용을 읽을 수 없습니다." };
  const b = body as Record<string, unknown>;

  const name = typeof b.studentName === "string" ? normalizeStudentName(b.studentName) : null;
  if (!name) return { ok: false, error: "이름이 없습니다. 처음 화면에서 이름을 다시 입력해 주세요." };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, error: `이름은 ${MAX_NAME_LENGTH}글자까지 쓸 수 있습니다.` };

  if (typeof b.paperId !== "string" || b.paperId === "" || b.paperId.includes("/")) {
    return { ok: false, error: "문제지 정보를 읽을 수 없습니다." };
  }
  if (!Array.isArray(b.answers) || !b.answers.every((a) => Number.isInteger(a) && a >= 1 && a <= 4)) {
    return { ok: false, error: "모든 문항에 답해야 제출할 수 있습니다." };
  }
  return { ok: true, value: { paperId: b.paperId, studentName: name, answers: b.answers as number[] } };
}

export function checkAnswers(answers: number[], questionCount: number): string | null {
  return answers.length === questionCount ? null : "모든 문항에 답해야 제출할 수 있습니다.";
}

export type ResultRecord = {
  paperId: string;
  paperTitle: string;
  studentName: string;
  answers: number[];
  score: number;
  correctCount: number;
  total: number;
  /** 틀린 문항 번호(1부터) */
  wrongQuestions: number[];
};

/** 채점하고, 저장할 결과와 학생에게 보여줄 채점 결과를 함께 만듭니다. */
export function buildResult(paper: QuestionPaper, submission: Submission): { record: ResultRecord; graded: GradeResult } {
  const graded = gradeQuiz(paper.questions, submission.answers);
  return {
    graded,
    record: {
      paperId: paper.id,
      paperTitle: paper.title,
      studentName: submission.studentName,
      answers: submission.answers,
      score: graded.score,
      correctCount: graded.correctCount,
      total: graded.total,
      wrongQuestions: graded.items.flatMap((it, i) => (it.isCorrect ? [] : [i + 1])),
    },
  };
}

/** 평균 점수(소수 첫째 자리까지 반올림). 결과가 없으면 null. 결과는 이미 이름별 최신 1개씩입니다. */
export function averageScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return calcScore(scores.reduce((sum, s) => sum + s, 0), scores.length * 100);
}
