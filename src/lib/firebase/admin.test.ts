import { describe, expect, it } from "vitest";
import { readCredentialSource } from "./admin";

// 가짜 키 모양으로만 확인합니다(실제 키 없음).
const fakeKey = (projectId = "quiz-app-5e205") =>
  JSON.stringify({ type: "service_account", project_id: projectId, client_email: "server@example.iam.gserviceaccount.com", private_key: "-----TEST-----\n" });

describe("서버 Firestore 연결 방식", () => {
  it("배포: 키 내용(FIREBASE_SERVICE_ACCOUNT_KEY)으로 연결", () => {
    const r = readCredentialSource({ FIREBASE_SERVICE_ACCOUNT_KEY: fakeKey(), NEXT_PUBLIC_FIREBASE_PROJECT_ID: "quiz-app-5e205", VERCEL: "1" });
    expect(r).toMatchObject({ ok: true, kind: "key", account: { projectId: "quiz-app-5e205" } });
  });

  it("내 컴퓨터: 키 파일 위치(GOOGLE_APPLICATION_CREDENTIALS)로 연결", () => {
    expect(readCredentialSource({ GOOGLE_APPLICATION_CREDENTIALS: "C:/keys/key.json" })).toEqual({ ok: true, kind: "file" });
  });

  it("Vercel에서는 내 컴퓨터 파일 경로만으로 연결하지 않음", () => {
    expect(readCredentialSource({ GOOGLE_APPLICATION_CREDENTIALS: "C:/keys/key.json", VERCEL: "1" })).toEqual({ ok: false, reason: "missing" });
  });

  it("키 내용이 JSON이 아니거나 필요한 값이 없으면 잘못된 키", () => {
    expect(readCredentialSource({ FIREBASE_SERVICE_ACCOUNT_KEY: "C:/keys/key.json" })).toEqual({ ok: false, reason: "invalid-key" });
    expect(readCredentialSource({ FIREBASE_SERVICE_ACCOUNT_KEY: '{"project_id":"quiz-app-5e205"}' })).toEqual({ ok: false, reason: "invalid-key" });
  });

  it("다른 Firebase 프로젝트의 키는 쓰지 않음", () => {
    const r = readCredentialSource({ FIREBASE_SERVICE_ACCOUNT_KEY: fakeKey("quiz-app-ec52e"), NEXT_PUBLIC_FIREBASE_PROJECT_ID: "quiz-app-5e205" });
    expect(r).toEqual({ ok: false, reason: "wrong-project" });
  });

  it("설정이 없으면 준비 안 됨", () => {
    expect(readCredentialSource({})).toEqual({ ok: false, reason: "missing" });
  });
});
