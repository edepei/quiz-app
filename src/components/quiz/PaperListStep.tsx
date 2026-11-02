import type { InvalidPaper, QuestionPaper } from "@/lib/quiz/types";

type Props = {
  papers: QuestionPaper[];
  invalid: InvalidPaper[];
  onSelect: (paper: QuestionPaper) => void;
};

export default function PaperListStep({ papers, invalid, onSelect }: Props) {
  return (
    <section className="card">
      <h1>문제 풀기</h1>

      {papers.length > 0 ? (
        <>
          <p>풀고 싶은 문제지를 골라 주세요.</p>
          <ul className="paper-list">
            {papers.map((paper) => (
              <li key={paper.id}>
                <button type="button" className="paper" onClick={() => onSelect(paper)}>
                  <span className="paper-title">{paper.title}</span>
                  <span className="muted">{paper.questions.length}문항</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="notice">아직 풀 수 있는 문제지가 없습니다. 선생님께 문의해 주세요.</p>
      )}

      {invalid.length > 0 && (
        <div className="error" role="alert">
          <p>아래 문제지는 형식이 맞지 않아 목록에서 뺐습니다.</p>
          <ul>
            {invalid.map((p) => (
              <li key={p.fileName}>
                <strong>{p.fileName}</strong>: {p.errors.join(" ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
