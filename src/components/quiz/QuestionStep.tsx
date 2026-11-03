import type { Answers, StudentQuestion } from "@/lib/quiz/types";

type Props = {
  questions: StudentQuestion[];
  answers: Answers;
  index: number;
  onChoose: (choice: number) => void;
  onMove: (index: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
};

export default function QuestionStep({ questions, answers, index, onChoose, onMove, onSubmit, submitting, submitError }: Props) {
  const q = questions[index];
  const total = questions.length;
  const isLast = index === total - 1;
  const unanswered = answers.flatMap((a, i) => (a === null ? [i + 1] : []));

  return (
    <section className="card">
      <p className="progress">
        {index + 1} / {total}
      </p>
      <div className="progress-bar" aria-hidden="true">
        <div style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <h2 className="question">{q.question}</h2>

      <div className="options" role="radiogroup" aria-label={`${index + 1}번 문항 보기`}>
        {q.options.map((opt, i) => {
          const num = i + 1;
          const selected = answers[index] === num;
          return (
            <button
              key={num}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`option${selected ? " selected" : ""}`}
              onClick={() => onChoose(num)}
            >
              <span className="option-num">{num}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="nav">
        <button type="button" className="button" onClick={() => onMove(index - 1)} disabled={index === 0 || submitting}>
          이전
        </button>
        {isLast ? (
          <button
            type="button"
            className="button primary"
            onClick={onSubmit}
            disabled={unanswered.length > 0 || submitting}
          >
            {submitting ? "제출하는 중…" : submitError ? "다시 제출하기" : "제출하고 채점하기"}
          </button>
        ) : (
          <button type="button" className="button primary" onClick={() => onMove(index + 1)}>
            다음
          </button>
        )}
      </div>

      {isLast && unanswered.length > 0 && (
        <p className="notice">
          아직 답하지 않은 문항: {unanswered.join(", ")}번. 모든 문항에 답하면 채점할 수 있습니다.
        </p>
      )}

      {submitError && (
        <div className="error" role="alert">
          <p>{submitError}</p>
          <p>고른 답은 그대로 남아 있습니다. &quot;다시 제출하기&quot;를 눌러 주세요.</p>
        </div>
      )}
    </section>
  );
}
