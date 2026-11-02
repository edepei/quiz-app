import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calcScore, gradeQuiz } from "./grade";
import { validateQuizText } from "./validate";

const sampleText = readFileSync(join(process.cwd(), "sample-questions.json"), "utf8");

const validQuestion = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};
const fileWith = (questions: unknown[]) => JSON.stringify({ questions });

describe("validateQuizText", () => {
  it("예시 파일의 10문항을 모두 받는다", () => {
    const r = validateQuizText(sampleText);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.questions).toHaveLength(10);
      expect(r.questions[0].correctAnswer).toBe(4);
      expect(r.questions[0].options[3]).toBe("키보드");
    }
  });

  it("JSON이 아니면 받지 않는다", () => {
    const r = validateQuizText("그냥 글자");
    expect(r.ok).toBe(false);
  });

  it("questions 목록이 없으면 받지 않는다", () => {
    const r = validateQuizText(JSON.stringify({ items: [] }));
    expect(r).toEqual({ ok: false, errors: [expect.stringContaining("questions")] });
  });

  it("문항이 0개면 받지 않는다", () => {
    const r = validateQuizText(fileWith([]));
    expect(r).toEqual({ ok: false, errors: ["문제 파일에 문항이 하나도 없습니다."] });
  });

  it("보기가 3개인 문항 번호와 이유를 알려준다", () => {
    const r = validateQuizText(fileWith([validQuestion, { ...validQuestion, options: ["가", "나", "다"] }]));
    expect(r).toEqual({
      ok: false,
      errors: ["2번 문항의 보기가 3개입니다. 보기는 4개여야 합니다."],
    });
  });

  it("정답 번호가 1~4가 아니면 받지 않는다", () => {
    for (const bad of [0, 5, 2.5, "1"]) {
      const r = validateQuizText(fileWith([{ ...validQuestion, correctAnswer: bad }]));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors[0]).toContain("1번 문항의 정답 번호");
    }
  });

  it("문제·해설이 비어 있으면 모두 알려준다", () => {
    const r = validateQuizText(fileWith([{ ...validQuestion, question: "", explanation: " " }]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(2);
  });
});

describe("gradeQuiz", () => {
  const r = validateQuizText(sampleText);
  if (!r.ok) throw new Error("예시 파일을 읽지 못했습니다");
  const questions = r.questions;
  const correct = questions.map((q) => q.correctAnswer);

  it("모두 맞히면 100점", () => {
    const g = gradeQuiz(questions, correct);
    expect(g.score).toBe(100);
    expect(g.correctCount).toBe(10);
  });

  it("10문항 중 7개 맞히면 70점이고 틀린 문항을 표시한다", () => {
    const answers = correct.map((a, i) => (i < 3 ? (a % 4) + 1 : a));
    const g = gradeQuiz(questions, answers);
    expect(g.score).toBe(70);
    expect(g.items.map((it) => it.isCorrect)).toEqual([false, false, false, true, true, true, true, true, true, true]);
    expect(g.items[0].chosen).toBe(1);
  });

  it("3문항 중 1개면 33.3점, 2개면 66.7점", () => {
    expect(calcScore(1, 3)).toBe(33.3);
    expect(calcScore(2, 3)).toBe(66.7);
  });
});
