import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as getPapers, POST as postPaper } from "./teacher/papers/route";
import { PATCH as patchPaper } from "./teacher/papers/[id]/route";
import { GET as getResults } from "./teacher/papers/[id]/results/route";

// 교사 기능 서버 창구는 화면과 상관없이 로그인 증명이 없거나 가짜면 Firestore에 닿기 전에 거절합니다.
const saved = { ...process.env };
beforeAll(() => {
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-project";
  process.env.TEACHER_EMAIL = "teacher@example.com";
});
afterAll(() => {
  process.env = saved;
});

const req = (method: string, auth?: string) =>
  new Request("http://localhost/api", {
    method,
    headers: auth ? { authorization: auth, "content-type": "application/json" } : { "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify({ text: "{}", published: true }),
  });
const params = { params: Promise.resolve({ id: "paper-1" }) };

describe("교사 기능 서버 창구", () => {
  for (const [label, auth] of [
    ["로그인 증명 없음", undefined],
    ["가짜 로그인 증명", "Bearer not-a-real-token"],
  ] as const) {
    it(`${label} → 401`, async () => {
      expect((await getPapers(req("GET", auth))).status).toBe(401);
      expect((await postPaper(req("POST", auth))).status).toBe(401);
      expect((await patchPaper(req("PATCH", auth), params)).status).toBe(401);
      expect((await getResults(req("GET", auth), params)).status).toBe(401);
    });
  }
});
