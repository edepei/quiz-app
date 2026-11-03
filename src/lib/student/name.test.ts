import { describe, expect, it } from "vitest";
import { normalizeStudentName } from "./name";

describe("normalizeStudentName", () => {
  it("앞뒤 공백을 지운 이름을 돌려준다", () => {
    expect(normalizeStudentName("  김민지 ")).toBe("김민지");
  });

  it("비어 있거나 공백뿐이면 null을 돌려준다", () => {
    expect(normalizeStudentName("")).toBeNull();
    expect(normalizeStudentName("   ")).toBeNull();
  });
});
