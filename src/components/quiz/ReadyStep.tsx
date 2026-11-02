type Props = {
  title: string;
  total: number;
  onStart: () => void;
  onBack: () => void;
};

export default function ReadyStep({ title, total, onStart, onBack }: Props) {
  return (
    <section className="card">
      <h1>문항 확인</h1>
      <p className="muted">{title}</p>
      <p className="big">총 {total}문항입니다.</p>
      <p className="muted">한 문제씩 풀고, 모든 문제를 마친 뒤 한 번에 채점합니다.</p>
      <div className="nav">
        <button type="button" className="button" onClick={onBack}>
          다른 문제지 고르기
        </button>
        <button type="button" className="button primary" onClick={onStart}>
          풀이 시작
        </button>
      </div>
    </section>
  );
}
