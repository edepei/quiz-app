import { beforeEach, describe, expect, it, vi } from "vitest";

// 결과 창구: 교사 확인 결과와 문제지 상태에 따라 응답이 달라지는지 봅니다(실제 Firestore는 쓰지 않음).
const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  results: vi.fn(),
}));
vi.mock("@/lib/teacher/verify", () => ({ bearerToken: () => "token", verifyTeacherToken: mocks.verify }));
vi.mock("@/lib/firebase/admin", () => ({ getDb: () => ({}) }));
vi.mock("@/lib/store/firestore", () => ({ getPaperResults: mocks.results }));

const { GET } = await import("./route");
const call = () => GET(new Request("http://localhost/api"), { params: Promise.resolve({ id: "paper-1" }) });

beforeEach(() => {
  mocks.verify.mockReset();
  mocks.results.mockReset();
});

describe("교사 결과 창구", () => {
  it("허용되지 않은 다른 Google 계정 → 403, 결과를 읽지 않음", async () => {
    mocks.verify.mockResolvedValue({ ok: false, reason: "not-allowed", email: "student@example.com" });
    expect((await call()).status).toBe(403);
    expect(mocks.results).not.toHaveBeenCalled();
  });

  it("숨긴(비공개) 문제지 → 409, 결과를 보내지 않음", async () => {
    mocks.verify.mockResolvedValue({ ok: true, email: "teacher@example.com" });
    mocks.results.mockResolvedValue({ status: "hidden" });
    const res = await call();
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: expect.stringContaining("숨긴 문제지") });
  });

  it("없는 문제지 → 404", async () => {
    mocks.verify.mockResolvedValue({ ok: true, email: "teacher@example.com" });
    mocks.results.mockResolvedValue({ status: "missing" });
    expect((await call()).status).toBe(404);
  });

  it("허용된 교사 → 결과표와 평균, 제출이 없으면 평균은 0점이 아니라 없음", async () => {
    mocks.verify.mockResolvedValue({ ok: true, email: "teacher@example.com" });
    mocks.results.mockResolvedValue({ status: "ok", title: "문제지", questionCount: 10, rows: [], average: null });
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ title: "문제지", questionCount: 10, rows: [], average: null });
  });
});
