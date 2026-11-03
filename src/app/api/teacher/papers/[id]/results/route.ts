import { getDb } from "@/lib/firebase/admin";
import { getPaperResults } from "@/lib/store/firestore";
import { storeFailed, storeNotReady } from "@/lib/store/responses";
import { requireTeacher } from "@/lib/teacher/guard";

// 문제지별 학생 결과표와 평균. 허용된 교사만 볼 수 있습니다.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const db = getDb();
  if (!db) return storeNotReady();

  try {
    const results = await getPaperResults(db, (await params).id);
    if (!results) return Response.json({ error: "문제지를 찾을 수 없습니다." }, { status: 404 });
    return Response.json(results);
  } catch (e) {
    return storeFailed(e);
  }
}
