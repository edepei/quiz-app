import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import type { QuestionPaper } from "@/lib/quiz/types";
import { validatePaperText } from "@/lib/quiz/validate";
import { averageScore, buildResult, checkAnswers, paperKeys, parseSubmission, resultDocId, toStudentPaper, wrongItems } from "./records";

let paper: QuestionPaper;

beforeAll(async () => {
  const r = validatePaperText(await readFile(join(process.cwd(), "question-papers", "sample-questions.json"), "utf8"));
  if (!r.ok) throw new Error("예시 문제지를 읽지 못했습니다");
  paper = { id: "paper-1", title: r.title, questions: r.questions };
});

describe("toStudentPaper", () => {
  it("풀이용 문제지에는 정답과 해설이 없다", () => {
    const s = toStudentPaper(paper);
    expect(s.questions).toHaveLength(10);
    expect(Object.keys(s.questions[0]).sort()).toEqual(["options", "question"]);
    expect(JSON.stringify(s)).not.toContain(paper.questions[0].explanation);
  });
});

describe("paperKeys (중복 확인)", () => {
  it("제목은 앞뒤·중복 공백과 대소문자를 무시한다", () => {
    expect(paperKeys("  중학교  정보과목 ", paper.questions).titleKey).toBe(paperKeys("중학교 정보과목", paper.questions).titleKey);
    expect(paperKeys("Info", []).titleKey).toBe(paperKeys("info", []).titleKey);
  });

  it("문항 내용이 같으면 같은 값, 하나라도 다르면 다른 값", () => {
    const same = paperKeys("다른 제목", structuredClone(paper.questions)).contentHash;
    const changed = structuredClone(paper.questions);
    changed[9].correctAnswer = changed[9].correctAnswer === 1 ? 2 : 1;
    expect(same).toBe(paperKeys("제목", paper.questions).contentHash);
    expect(paperKeys("제목", changed).contentHash).not.toBe(same);
  });
});

describe("parseSubmission", () => {
  const ok = { paperId: "paper-1", studentName: "  김민지 ", answers: [1, 2, 3, 4] };

  it("이름 앞뒤 공백을 지우고 받는다", () => {
    expect(parseSubmission(ok)).toEqual({ ok: true, value: { ...ok, studentName: "김민지" } });
  });

  it("이름이 없거나 너무 길면 받지 않는다", () => {
    expect(parseSubmission({ ...ok, studentName: "  " }).ok).toBe(false);
    expect(parseSubmission({ ...ok, studentName: "가".repeat(31) }).ok).toBe(false);
  });

  it("답하지 않은 문항이나 1~4가 아닌 답이 있으면 받지 않는다", () => {
    for (const answers of [[1, null, 3], [0], [5], [2.5], "1234", undefined]) {
      expect(parseSubmission({ ...ok, answers }).ok).toBe(false);
    }
  });

  it("문제지 번호가 이상하면 받지 않는다", () => {
    expect(parseSubmission({ ...ok, paperId: "a/b" }).ok).toBe(false);
    expect(parseSubmission({ ...ok, paperId: "" }).ok).toBe(false);
    expect(parseSubmission(null).ok).toBe(false);
  });

  it("문항 수와 답 수가 다르면 알려준다", () => {
    expect(checkAnswers([1, 2], 3)).not.toBeNull();
    expect(checkAnswers([1, 2, 3], 3)).toBeNull();
  });
});

describe("buildResult", () => {
  it("점수와 틀린 문항 번호를 함께 저장한다", () => {
    const answers = paper.questions.map((q, i) => (i === 1 || i === 4 || i === 9 ? (q.correctAnswer % 4) + 1 : q.correctAnswer));
    const { record, graded } = buildResult(paper, { paperId: "paper-1", studentName: "김민지", answers });
    expect(record).toEqual({
      paperId: "paper-1",
      paperTitle: "중학교 정보과목",
      studentName: "김민지",
      answers,
      score: 70,
      correctCount: 7,
      total: 10,
      wrongQuestions: [2, 5, 10],
    });
    expect(graded.items[1].question.explanation).toBe(paper.questions[1].explanation);
  });
});

describe("resultDocId (다시 풀면 최신 결과로 덮어쓰기)", () => {
  it("같은 문제지·같은 이름이면 같은 문서", () => {
    expect(resultDocId("p1", "김민지")).toBe(resultDocId("p1", "김민지"));
    expect(resultDocId("p1", "김민지")).not.toBe(resultDocId("p2", "김민지"));
    expect(resultDocId("p1", "김민지")).not.toBe(resultDocId("p1", "이서준"));
  });
});

describe("averageScore", () => {
  it("소수 첫째 자리까지 반올림하고, 결과가 없으면 null", () => {
    expect(averageScore([100, 70, 50])).toBe(73.3);
    expect(averageScore([33.3, 66.7])).toBe(50);
    expect(averageScore([])).toBeNull();
  });

  it("점수 합계 ÷ 제출 학생 수 (실제 저장된 중학교 정보과목 결과 10·90·60점 → 53.3점)", () => {
    expect(averageScore([10, 90, 60])).toBe(53.3);
    expect(averageScore([70])).toBe(70);
  });
});

describe("wrongItems", () => {
  const qs = [{ question: "1번 문제" }, { question: "2번 문제" }, { question: "3번 문제" }];

  it("틀린 번호마다 문제 내용을 붙임", () => {
    expect(wrongItems(qs, 3, [1, 3])).toEqual([
      { number: 1, question: "1번 문제" },
      { number: 3, question: "3번 문제" },
    ]);
  });

  it("틀린 문제가 없으면 빈 목록", () => {
    expect(wrongItems(qs, 3, [])).toEqual([]);
  });

  it("문항 수가 맞지 않거나 없는 번호면 내용을 지어내지 않고 null", () => {
    expect(wrongItems(qs, 10, [1])).toEqual([{ number: 1, question: null }]);
    expect(wrongItems(qs, 3, [5])).toEqual([{ number: 5, question: null }]);
  });
});
