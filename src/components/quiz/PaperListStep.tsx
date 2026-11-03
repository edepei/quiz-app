import type { StudentPaper } from "@/lib/quiz/types";

type Props = {
  papers: StudentPaper[];
  loadError: string | null;
  onSelect: (paper: StudentPaper) => void;
};

export default function PaperListStep({ papers, loadError, onSelect }: Props) {
  return (
    <section className="card">
      <h1>문제 풀기</h1>

      {loadError ? (
        <p className="error" role="alert">
          {loadError}
        </p>
      ) : papers.length > 0 ? (
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
    </section>
  );
}
