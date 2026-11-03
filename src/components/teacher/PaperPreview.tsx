import type { Question } from "@/lib/quiz/types";

// 저장하기 전에 교사에게 보여주는 문제지 내용(문항·보기·정답·해설)입니다.
export default function PaperPreview({ questions }: { questions: Question[] }) {
  return (
    <ol className="preview-list">
      {questions.map((q, i) => (
        <li key={i}>
          <p className="question">{q.question}</p>
          <ol className="preview-options">
            {q.options.map((opt, j) => (
              <li key={j} className={j + 1 === q.correctAnswer ? "answer" : undefined}>
                {opt}
                {j + 1 === q.correctAnswer && " (정답)"}
              </li>
            ))}
          </ol>
          <p className="muted small">해설: {q.explanation}</p>
        </li>
      ))}
    </ol>
  );
}
