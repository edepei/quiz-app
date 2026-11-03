import { getDb } from "@/lib/firebase/admin";
import { setPublished } from "@/lib/store/firestore";
import { storeFailed, storeNotReady } from "@/lib/store/responses";
import { requireTeacher } from "@/lib/teacher/guard";

// 공개 / 비공개 바꾸기
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const db = getDb();
  if (!db) return storeNotReady();

  const body = (await request.json().catch(() => null)) as { published?: unknown } | null;
  if (typeof body?.published !== "boolean") return Response.json({ error: "요청 내용을 읽을 수 없습니다." }, { status: 400 });

  try {
    const found = await setPublished(db, (await params).id, body.published);
    if (!found) return Response.json({ error: "문제지를 찾을 수 없습니다." }, { status: 404 });
    return Response.json({ published: body.published });
  } catch (e) {
    return storeFailed(e);
  }
}
