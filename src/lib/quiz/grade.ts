import type { Answers, GradeResult, Question } from "./types";

/** 정답 수 ÷ 전체 문항 수 × 100, 소수 첫째 자리까지 반올림 */
export function calcScore(correctCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correctCount / total) * 1000) / 10;
}

export function gradeQuiz(questions: Question[], answers: Answers): GradeResult {
  const items = questions.map((question, i) => {
    const chosen = answers[i] ?? null;
    return { question, chosen, isCorrect: chosen === question.correctAnswer };
  });
  const correctCount = items.filter((it) => it.isCorrect).length;
  return {
    total: questions.length,
    correctCount,
    score: calcScore(correctCount, questions.length),
    items,
  };
}
