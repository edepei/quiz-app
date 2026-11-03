type Props = {
  email: string;
  onSignOut: () => void;
};

// 로그인한 교사에게만 보이는 화면입니다. 문제 등록·결과 조회는 다음 단계에서 연결합니다.
export default function TeacherDashboard({ email, onSignOut }: Props) {
  return (
    <section className="card">
      <h1>교사 화면</h1>
      <p className="muted">{email} 계정으로 로그인했습니다.</p>

      <div className="panel">
        <h2>문제 등록</h2>
        <p className="muted">학습자료를 올려 문제를 만들고 학생에게 공개하는 곳입니다. 다음 단계에서 연결됩니다.</p>
      </div>

      <div className="panel">
        <h2>학생 풀이 결과</h2>
        <p className="muted">학생별 점수와 틀린 문제, 평균을 보는 곳입니다. 다음 단계에서 연결됩니다.</p>
      </div>

      <div className="nav">
        <button type="button" className="button" onClick={onSignOut}>
          로그아웃
        </button>
      </div>
    </section>
  );
}
