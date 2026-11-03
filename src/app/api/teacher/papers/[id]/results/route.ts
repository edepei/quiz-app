import { getDb } from "@/lib/firebase/admin";
import { getPaperResults } from "@/lib/store/firestore";
import { storeFailed, storeNotReady } from "@/lib/store/responses";
import { requireTeacher } from "@/lib/teacher/guard";

// 문제지별 학생 결과표와 평균. 허용된 교사만 볼 수 있고, 숨긴(비공개) 문제지는 보여 주지 않습니다.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const db = getDb();
  if (!db) return storeNotReady();

  try {
    const { status, ...results } = await getPaperResults(db, (await params).id);
    if (status === "missing") return Response.json({ error: "문제지를 찾을 수 없습니다." }, { status: 404 });
    if (status === "hidden") {
      // 403은 교사 화면에서 로그인 오류로 안내되므로 다른 번호를 씁니다.
      return Response.json({ error: "숨긴 문제지는 결과를 보여 주지 않습니다. 공개하면 다시 볼 수 있습니다." }, { status: 409 });
    }
    return Response.json(results);
  } catch (e) {
    return storeFailed(e);
  }
}
