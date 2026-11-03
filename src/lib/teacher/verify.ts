import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

// Firebase 로그인 증명(ID 토큰)을 서버에서 확인하고, 허용된 교사 이메일인지 봅니다.
// Google 공개키로 서명만 확인하므로 비밀키가 필요 없습니다.

const FIREBASE_KEYS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
);
let firebaseKeys: JWTVerifyGetKey | null = null;

export type TeacherCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "not-configured" | "no-token" | "invalid" | "not-allowed"; email?: string };

export type TeacherConfig = {
  projectId: string | undefined;
  teacherEmail: string | undefined;
};

export function readTeacherConfig(): TeacherConfig {
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    teacherEmail: process.env.TEACHER_EMAIL,
  };
}

export function isAllowedTeacher(email: string | undefined, teacherEmail: string): boolean {
  return !!email && email.trim().toLowerCase() === teacherEmail.trim().toLowerCase();
}

export function bearerToken(header: string | null): string | null {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function verifyTeacherToken(
  token: string | null,
  config: TeacherConfig = readTeacherConfig(),
  keys?: JWTVerifyGetKey,
): Promise<TeacherCheck> {
  const { projectId, teacherEmail } = config;
  if (!projectId || !teacherEmail) return { ok: false, reason: "not-configured" };
  if (!token) return { ok: false, reason: "no-token" };

  let payload;
  try {
    ({ payload } = await jwtVerify(token, keys ?? (firebaseKeys ??= createRemoteJWKSet(FIREBASE_KEYS_URL)), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    }));
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (!payload.sub) return { ok: false, reason: "invalid" };
  const email = typeof payload.email === "string" ? payload.email : undefined;
  if (payload.email_verified !== true || !isAllowedTeacher(email, teacherEmail)) {
    return { ok: false, reason: "not-allowed", email };
  }
  return { ok: true, email: email! };
}
