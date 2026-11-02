import type { Question } from "./types";

export type ValidateResult =
  | { ok: true; questions: Question[] }
  | { ok: false; errors: string[] };

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim() !== "";

/**
 * 업로드한 파일의 글자 내용을 검사합니다.
 * 하나라도 잘못된 문항이 있으면 파일 전체를 받지 않고, 이유를 쉬운 말로 모두 돌려줍니다.
 */
export function validateQuizText(text: string): ValidateResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      errors: ["문제 파일의 형식을 읽을 수 없습니다. 올바른 JSON 문제 파일인지 확인해 주세요."],
    };
  }

  if (typeof data !== "object" || data === null || !Array.isArray((data as { questions?: unknown }).questions)) {
    return {
      ok: false,
      errors: ["문제 파일에 문제 목록(questions)이 없습니다. 파일 맨 위에 questions 목록이 있어야 합니다."],
    };
  }

  const raw = (data as { questions: unknown[] }).questions;
  if (raw.length === 0) {
    return { ok: false, errors: ["문제 파일에 문항이 하나도 없습니다."] };
  }

  const errors: string[] = [];
  raw.forEach((item, i) => {
    const n = i + 1;
    if (typeof item !== "object" || item === null) {
      errors.push(`${n}번 문항의 내용을 읽을 수 없습니다.`);
      return;
    }
    const q = item as Record<string, unknown>;

    if (!isNonEmptyString(q.question)) {
      errors.push(`${n}번 문항에 문제 내용(question)이 없습니다.`);
    }

    if (!Array.isArray(q.options)) {
      errors.push(`${n}번 문항에 보기 목록(options)이 없습니다.`);
    } else if (q.options.length !== 4) {
      errors.push(`${n}번 문항의 보기가 ${q.options.length}개입니다. 보기는 4개여야 합니다.`);
    } else if (!q.options.every(isNonEmptyString)) {
      errors.push(`${n}번 문항에 비어 있는 보기가 있습니다.`);
    }

    const a = q.correctAnswer;
    if (typeof a !== "number" || !Number.isInteger(a) || a < 1 || a > 4) {
      errors.push(`${n}번 문항의 정답 번호(correctAnswer)가 잘못되었습니다. 1, 2, 3, 4 중 하나여야 합니다.`);
    }

    if (!isNonEmptyString(q.explanation)) {
      errors.push(`${n}번 문항에 해설(explanation)이 없습니다.`);
    }
  });

  if (errors.length > 0) return { ok: false, errors };

  const questions = raw.map((item) => {
    const q = item as Question;
    return {
      question: q.question,
      options: [...q.options] as Question["options"],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    };
  });
  return { ok: true, questions };
}
