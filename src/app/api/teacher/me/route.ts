import { requireTeacher } from "@/lib/teacher/guard";

// 교사 화면이 열릴 때 호출합니다. 다른 교사 기능 서버 창구도 같은 requireTeacher로 확인합니다.
export async function GET(request: Request) {
  const teacher = await requireTeacher(request);
  return teacher.ok ? Response.json({ email: teacher.email }) : teacher.response;
}
