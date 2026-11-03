import { bearerToken, verifyTeacherToken } from "@/lib/teacher/verify";

// 교사 화면이 열릴 때 호출합니다. 앞으로 교사 기능 서버 창구도 같은 verifyTeacherToken으로 확인합니다.
const STATUS = { "not-configured": 503, "no-token": 401, invalid: 401, "not-allowed": 403 } as const;

export async function GET(request: Request) {
  const check = await verifyTeacherToken(bearerToken(request.headers.get("authorization")));
  if (check.ok) return Response.json({ email: check.email });
  return Response.json({ reason: check.reason }, { status: STATUS[check.reason] });
}
