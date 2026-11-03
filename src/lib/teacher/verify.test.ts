import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { bearerToken, isAllowedTeacher, verifyTeacherToken } from "./verify";

const config = { projectId: "demo-project", teacherEmail: "teacher@example.com" };
let privateKey: CryptoKey;
let keys: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: "test", alg: "RS256" };
  keys = createLocalJWKSet({ keys: [jwk] });
});

function token(claims: Record<string, unknown>, opts: { issuer?: string; audience?: string } = {}) {
  return new SignJWT({ email_verified: true, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setSubject("user-1")
    .setIssuedAt()
    .setExpirationTime("1h")
    .setIssuer(opts.issuer ?? "https://securetoken.google.com/demo-project")
    .setAudience(opts.audience ?? "demo-project")
    .sign(privateKey);
}

describe("verifyTeacherToken", () => {
  it("허용된 이메일이면 통과한다 (대소문자 무시)", async () => {
    const r = await verifyTeacherToken(await token({ email: "Teacher@Example.com" }), config, keys);
    expect(r).toEqual({ ok: true, email: "Teacher@Example.com" });
  });

  it("다른 Google 계정이면 not-allowed", async () => {
    const r = await verifyTeacherToken(await token({ email: "student@example.com" }), config, keys);
    expect(r).toEqual({ ok: false, reason: "not-allowed", email: "student@example.com" });
  });

  it("이메일 확인이 안 된 계정이면 not-allowed", async () => {
    const r = await verifyTeacherToken(
      await token({ email: "teacher@example.com", email_verified: false }),
      config,
      keys,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not-allowed");
  });

  it("다른 Firebase 프로젝트의 증명이면 invalid", async () => {
    const other = await token({ email: "teacher@example.com" }, { audience: "other", issuer: "https://securetoken.google.com/other" });
    expect(await verifyTeacherToken(other, config, keys)).toEqual({ ok: false, reason: "invalid" });
  });

  it("엉터리 증명이면 invalid, 증명이 없으면 no-token", async () => {
    expect(await verifyTeacherToken("abc.def.ghi", config, keys)).toEqual({ ok: false, reason: "invalid" });
    expect(await verifyTeacherToken(null, config, keys)).toEqual({ ok: false, reason: "no-token" });
  });

  it("설정값이 없으면 not-configured", async () => {
    const r = await verifyTeacherToken("x", { projectId: undefined, teacherEmail: undefined }, keys);
    expect(r).toEqual({ ok: false, reason: "not-configured" });
  });
});

describe("helpers", () => {
  it("bearerToken은 Authorization 머리글에서 증명만 꺼낸다", () => {
    expect(bearerToken("Bearer abc")).toBe("abc");
    expect(bearerToken("abc")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });

  it("isAllowedTeacher는 빈 이메일을 막는다", () => {
    expect(isAllowedTeacher(undefined, "a@b.c")).toBe(false);
    expect(isAllowedTeacher(" A@B.C ", "a@b.c")).toBe(true);
  });
});
