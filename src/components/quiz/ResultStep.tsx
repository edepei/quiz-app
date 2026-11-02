import type { GradeResult, Question } from "@/lib/quiz/types";

type Props = {
  result: GradeResult;
  onRetry: () => void;
  onBackToList: () => void;
};

const answerText = (q: Question, num: number | null) =>
  num === null ? "답하지 않음" : `${num}번. ${q.options[num - 1]}`;

export default function ResultStep({ result, onRetry, onBackToList }: Props) {
  return (
    <section className="card">
      <h1>결과</h1>
      <p className="score">
        <strong>{result.score}</strong>점
      </p>
      <p className="muted center">
        {result.total}문항 중 {result.correctCount}문항을 맞혔습니다.
      </p>

      <ol className="results">
        {result.items.map((it, i) => (
          <li key={i} className={it.isCorrect ? "right" : "wrong"}>
            <p className="result-head">
              <span>{i + 1}번</span>
              <span className="badge">{it.isCorrect ? "맞음" : "틀림"}</span>
            </p>
            <p className="question">{it.question.question}</p>
            <dl>
              <dt>내가 고른 답</dt>
              <dd>{answerText(it.question, it.chosen)}</dd>
              <dt>정답</dt>
              <dd>{answerText(it.question, it.question.correctAnswer)}</dd>
              <dt>해설</dt>
              <dd>{it.question.explanation}</dd>
            </dl>
          </li>
        ))}
      </ol>

      <div className="nav">
        <button type="button" className="button" onClick={onRetry}>
          다시 풀기
        </button>
        <button type="button" className="button primary" onClick={onBackToList}>
          문제지 목록으로
        </button>
      </div>
    </section>
  );
}
