import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { calcScore, gradeQuiz } from "./grade";
import { loadQuestionPapers, PAPERS_DIR } from "./papers";
import { validatePaperText } from "./validate";

const samplePath = join(PAPERS_DIR, "sample-questions.json");

const validQuestion = {
  question: "문제",
  options: ["가", "나", "다", "라"],
  correctAnswer: 2,
  explanation: "해설",
};
const paperWith = (questions: unknown[], title: unknown = "제목") => JSON.stringify({ title, questions });

describe("validatePaperText", () => {
  it("예시 문제지의 제목과 10문항을 모두 읽는다", async () => {
    const r = validatePaperText(await readFile(samplePath, "utf8"));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.title).toBe("중학교 정보과목");
      expect(r.questions).toHaveLength(10);
      expect(r.questions[0].correctAnswer).toBe(4);
      expect(r.questions[0].options[3]).toBe("키보드");
    }
  });

  it("JSON이 아니면 쓰지 않는다", () => {
    expect(validatePaperText("그냥 글자").ok).toBe(false);
  });

  it("제목(title)이 없으면 알려준다", () => {
    const r = validatePaperText(JSON.stringify({ questions: [validQuestion] }));
    expect(r).toEqual({ ok: false, errors: ["문제지 제목(title)이 없습니다."] });
  });

  it("questions 목록이 없으면 쓰지 않는다", () => {
    const r = validatePaperText(JSON.stringify({ title: "제목", items: [] }));
    expect(r).toEqual({ ok: false, errors: [expect.stringContaining("questions")] });
  });

  it("문항이 0개면 쓰지 않는다", () => {
    const r = validatePaperText(paperWith([]));
    expect(r).toEqual({ ok: false, errors: ["문제지에 문항이 하나도 없습니다."] });
  });

  it("보기가 3개인 문항 번호와 이유를 알려준다", () => {
    const r = validatePaperText(paperWith([validQuestion, { ...validQuestion, options: ["가", "나", "다"] }]));
    expect(r).toEqual({
      ok: false,
      errors: ["2번 문항의 보기가 3개입니다. 보기는 4개여야 합니다."],
    });
  });

  it("정답 번호가 1~4가 아니면 쓰지 않는다", () => {
    for (const bad of [0, 5, 2.5, "1"]) {
      const r = validatePaperText(paperWith([{ ...validQuestion, correctAnswer: bad }]));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors[0]).toContain("1번 문항의 정답 번호");
    }
  });

  it("문제·해설이 비어 있으면 모두 알려준다", () => {
    const r = validatePaperText(paperWith([{ ...validQuestion, question: "", explanation: " " }]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(2);
  });
});

describe("loadQuestionPapers", () => {
  it("question-papers 폴더의 문제지를 제목과 함께 읽는다", async () => {
    const { papers, invalid } = await loadQuestionPapers();
    expect(invalid).toEqual([]);
    expect(papers.map((p) => [p.id, p.title, p.questions.length])).toEqual([
      ["sample-questions.json", "중학교 정보과목", 10],
    ]);
  });

  // 앱 폴더에는 아무것도 추가하지 않고, 컴퓨터의 임시 폴더에서만 점검한 뒤 지웁니다.
  describe("여러 문제지가 있을 때 (임시 폴더)", () => {
    let dir: string;
    let sampleQuestions: unknown[];

    beforeAll(async () => {
      dir = await mkdtemp(join(tmpdir(), "question-papers-"));
      sampleQuestions = JSON.parse(await readFile(samplePath, "utf8")).questions;
      await writeFile(join(dir, "b.json"), JSON.stringify({ title: "두 번째 문제지", questions: sampleQuestions.slice(5) }));
      await writeFile(join(dir, "a.json"), JSON.stringify({ title: "첫 번째 문제지", questions: sampleQuestions.slice(0, 3) }));
      await writeFile(join(dir, "c.json"), JSON.stringify({ questions: sampleQuestions }));
      await writeFile(join(dir, "memo.txt"), "json 파일이 아님");
    });

    afterAll(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it("각 파일의 title을 파일 이름 순으로 보여주고, 각자의 문항을 가진다", async () => {
      const { papers } = await loadQuestionPapers(dir);
      expect(papers.map((p) => p.title)).toEqual(["첫 번째 문제지", "두 번째 문제지"]);
      expect(papers[0].questions).toEqual(sampleQuestions.slice(0, 3));
      expect(papers[1].questions).toEqual(sampleQuestions.slice(5));
    });

    it("제목이 없는 파일은 목록에서 빼고 이유를 알려준다", async () => {
      const { invalid } = await loadQuestionPapers(dir);
      expect(invalid).toEqual([{ fileName: "c.json", errors: ["문제지 제목(title)이 없습니다."] }]);
    });
  });

  it("폴더가 없으면 빈 목록", async () => {
    expect(await loadQuestionPapers(join(tmpdir(), "no-such-question-papers-dir"))).toEqual({ papers: [], invalid: [] });
  });
});

describe("gradeQuiz", () => {
  let questions: ReturnType<typeof getQuestions>;
  const getQuestions = (text: string) => {
    const r = validatePaperText(text);
    if (!r.ok) throw new Error("예시 문제지를 읽지 못했습니다");
    return r.questions;
  };

  beforeAll(async () => {
    questions = getQuestions(await readFile(samplePath, "utf8"));
  });

  it("모두 맞히면 100점", () => {
    const g = gradeQuiz(questions, questions.map((q) => q.correctAnswer));
    expect(g.score).toBe(100);
    expect(g.correctCount).toBe(10);
  });

  it("10문항 중 7개 맞히면 70점이고 틀린 문항을 표시한다", () => {
    const answers = questions.map((q, i) => (i < 3 ? (q.correctAnswer % 4) + 1 : q.correctAnswer));
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
