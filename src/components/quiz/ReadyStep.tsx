type Props = {
  fileName: string;
  total: number;
  onStart: () => void;
};

export default function ReadyStep({ fileName, total, onStart }: Props) {
  return (
    <section className="card">
      <h1>문항 확인</h1>
      <p className="muted">{fileName}</p>
      <p className="big">총 {total}문항입니다.</p>
      <p className="muted">한 문제씩 풀고, 모든 문제를 마친 뒤 한 번에 채점합니다.</p>
      <button type="button" className="button primary" onClick={onStart}>
        풀이 시작
      </button>
    </section>
  );
}
