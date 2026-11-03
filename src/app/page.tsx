import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <section className="card">
        <h1>문제 풀기</h1>
        <p>어떤 분으로 시작할지 골라 주세요.</p>
        <ul className="paper-list">
          <li>
            <Link href="/teacher" className="paper">
              <span className="paper-title">교사로 시작하기</span>
              <span className="muted">문제 등록 · 결과 확인</span>
            </Link>
          </li>
          <li>
            <Link href="/student" className="paper">
              <span className="paper-title">학생으로 시작하기</span>
              <span className="muted">이름 입력 후 문제 풀기</span>
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
