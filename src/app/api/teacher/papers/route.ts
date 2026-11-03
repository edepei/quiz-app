import { getDb } from "@/lib/firebase/admin";
import { validatePaperText } from "@/lib/quiz/validate";
import { createPaper, listPapersForTeacher } from "@/lib/store/firestore";
import { storeFailed, storeNotReady } from "@/lib/store/responses";
import { requireTeacher } from "@/lib/teacher/guard";

const MAX_TEXT_LENGTH = 500_000;

// 등록한 문제지 목록(공개 여부 포함)
export async function GET(request: Request) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const db = getDb();
  if (!db) return storeNotReady();
  try {
    return Response.json({ papers: await listPapersForTeacher(db) });
  } catch (e) {
    return storeFailed(e);
  }
}

// 문제지 등록: 화면에서 확인한 파일 내용을 서버에서 한 번 더 검사한 뒤 비공개로 저장합니다.
export async function POST(request: Request) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const db = getDb();
  if (!db) return storeNotReady();

  const body = (await request.json().catch(() => null)) as { text?: unknown; fileName?: unknown } | null;
  if (typeof body?.text !== "string") return Response.json({ errors: ["파일 내용을 읽을 수 없습니다."] }, { status: 400 });
  if (body.text.length > MAX_TEXT_LENGTH) return Response.json({ errors: ["파일이 너무 큽니다."] }, { status: 400 });

  const checked = validatePaperText(body.text);
  if (!checked.ok) return Response.json({ errors: checked.errors }, { status: 400 });

  try {
    const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 200) : "";
    const result = await createPaper(db, { title: checked.title, questions: checked.questions, fileName });
    if (result.ok) return Response.json({ id: result.id }, { status: 201 });
    const why = result.reason === "duplicate-title" ? "제목이 같은" : "문항 내용이 같은";
    return Response.json(
      { errors: [`이미 등록된 문제지 "${result.title}"와(과) ${why} 문제지입니다. 중복으로 저장하지 않았습니다.`] },
      { status: 409 },
    );
  } catch (e) {
    return storeFailed(e);
  }
}
