import { validatePaperText, type ValidateResult } from "@/lib/quiz/validate";

// AI가 만든 문제지가 저장할 수 있는 모양인지 검사합니다. 생성 직후(서버)와 저장할 때(서버) 모두 씁니다.
// 형식만 검사합니다. 문제 내용이 학습자료와 맞는지는 교사가 결과 화면에서 확인합니다.

export const GENERATED_QUESTION_COUNT = 10;
export const MAX_TITLE_LENGTH = 100;

export function validateGeneratedText(text: string): ValidateResult {
  const checked = validatePaperText(text);
  if (!checked.ok) return checked;

  const errors: string[] = [];
  if ([...checked.title.trim()].length > MAX_TITLE_LENGTH) errors.push(`제목이 ${MAX_TITLE_LENGTH}자를 넘습니다.`);
  if (checked.questions.length !== GENERATED_QUESTION_COUNT) {
    errors.push(`문항이 ${checked.questions.length}개입니다. ${GENERATED_QUESTION_COUNT}문항이어야 합니다.`);
  }
  return errors.length ? { ok: false, errors } : checked;
}
