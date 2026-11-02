/** 문제 파일 한 문항. correctAnswer는 1~4이며 1이 options의 첫 번째 보기입니다. */
export type Question = {
  question: string;
  options: [string, string, string, string];
  correctAnswer: 1 | 2 | 3 | 4;
  explanation: string;
};

/** 이용자가 고른 답. 인덱스는 문항 순서, 값은 1~4 또는 아직 고르지 않음(null). */
export type Answers = (number | null)[];

export type GradedItem = {
  question: Question;
  chosen: number | null;
  isCorrect: boolean;
};

export type GradeResult = {
  total: number;
  correctCount: number;
  /** 100점 만점, 소수 첫째 자리까지 반올림 */
  score: number;
  items: GradedItem[];
};
