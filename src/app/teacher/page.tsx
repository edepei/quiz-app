import Link from "next/link";

// 교사 화면의 기본 틀입니다. 로그인(Firebase)과 문제 등록·결과 조회는 다음 단계에서 연결합니다.
export default function TeacherPage() {
  return (
    <main className="container">
      <header className="topbar">
        <span className="topbar-name">교사 화면</span>
        <Link href="/" className="button small">
          첫 화면으로
        </Link>
      </header>

      <section className="card">
        <h1>교사 화면</h1>
        <p className="notice">아직 로그인이 연결되지 않았습니다. 다음 단계에서 Google 로그인을 추가합니다.</p>

        <div className="panel">
          <h2>문제 등록</h2>
          <p className="muted">학습자료를 올려 문제를 만들고 학생에게 공개하는 곳입니다. 다음 단계에서 연결됩니다.</p>
        </div>

        <div className="panel">
          <h2>학생 풀이 결과</h2>
          <p className="muted">학생별 점수와 틀린 문제, 평균을 보는 곳입니다. 다음 단계에서 연결됩니다.</p>
        </div>
      </section>
    </main>
  );
}
