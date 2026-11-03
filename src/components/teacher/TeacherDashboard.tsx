"use client";

import type { User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import type { TeacherPaperRow } from "@/lib/store/firestore";
import { errorMessages, teacherFetch } from "./api";
import PaperResults from "./PaperResults";
import PaperUpload from "./PaperUpload";

type Props = {
  email: string;
  user: User;
  onSignOut: () => void;
};

// 로그인한 교사에게만 보이는 화면입니다. 버튼을 숨기는 것과 별개로, 서버 창구가 요청마다 교사 권한을 다시 확인합니다.
export default function TeacherDashboard({ email, user, onSignOut }: Props) {
  const getToken = useCallback(() => user.getIdToken(), [user]);
  const [papers, setPapers] = useState<TeacherPaperRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const loadPapers = useCallback(async () => {
    try {
      setPapers((await teacherFetch<{ papers: TeacherPaperRow[] }>(getToken, "/api/teacher/papers")).papers);
      setError(null);
    } catch (e) {
      setError(errorMessages(e).join(" "));
    }
  }, [getToken]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  async function togglePublished(paper: TeacherPaperRow) {
    setBusyId(paper.id);
    try {
      await teacherFetch(getToken, `/api/teacher/papers/${paper.id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: !paper.published }),
      });
      await loadPapers();
    } catch (e) {
      setError(errorMessages(e).join(" "));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="card">
      <h1>교사 화면</h1>
      <p className="muted">{email} 계정으로 로그인했습니다.</p>

      <PaperUpload getToken={getToken} onSaved={loadPapers} />

      <div className="panel">
        <h2>등록한 문제지</h2>
        <p className="muted">
          &quot;공개&quot; 상태인 문제지만 학생 목록에 보입니다. &quot;결과 보기&quot;를 누르면 학생 점수표가 열립니다.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {papers === null && !error && <p className="muted">불러오는 중입니다…</p>}
        {papers?.length === 0 && <p className="notice">아직 등록한 문제지가 없습니다. 위에서 문제지 파일을 올려 주세요.</p>}
        {papers && papers.length > 0 && (
          <ul className="teacher-papers">
            {papers.map((p) => (
              <li key={p.id}>
                <div className="teacher-paper-head">
                  <div>
                    <span className="paper-title">{p.title}</span>{" "}
                    <span className="muted small">{p.questionCount}문항</span>{" "}
                    <span className={`status ${p.published ? "on" : "off"}`}>{p.published ? "공개" : "비공개"}</span>
                  </div>
                  <div className="teacher-paper-actions">
                    <button
                      type="button"
                      className={`button small${p.published ? "" : " primary"}`}
                      onClick={() => togglePublished(p)}
                      disabled={busyId === p.id}
                    >
                      {busyId === p.id ? "바꾸는 중…" : p.published ? "비공개로 바꾸기" : "공개하기"}
                    </button>
                    <button
                      type="button"
                      className="button small"
                      aria-expanded={openId === p.id}
                      onClick={() => setOpenId(openId === p.id ? null : p.id)}
                    >
                      {openId === p.id ? "결과 닫기" : "결과 보기"}
                    </button>
                  </div>
                </div>
                {openId === p.id && <PaperResults getToken={getToken} paperId={p.id} />}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="nav">
        <button type="button" className="button" onClick={onSignOut}>
          로그아웃
        </button>
      </div>
    </section>
  );
}
