import { bearerToken, verifyTeacherToken } from "./verify";

// 교사 기능 서버 창구마다 맨 먼저 호출합니다. 화면 버튼과 상관없이 요청마다 로그인 증명과 허용 이메일을 확인합니다.
const STATUS = { "not-configured": 503, "no-token": 401, invalid: 401, "not-allowed": 403 } as const;

export async function requireTeacher(request: Request): Promise<{ ok: true; email: string } | { ok: false; response: Response }> {
  const check = await verifyTeacherToken(bearerToken(request.headers.get("authorization")));
  if (check.ok) return { ok: true, email: check.email };
  return { ok: false, response: Response.json({ reason: check.reason }, { status: STATUS[check.reason] }) };
}

