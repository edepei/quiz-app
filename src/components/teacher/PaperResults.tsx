"use client";

import { useEffect, useState } from "react";
import type { ResultRow } from "@/lib/store/firestore";
import { errorMessages, teacherFetch, type GetToken } from "./api";

type Results = { title: string; questionCount: number; rows: ResultRow[]; average: number | null };

type Props = {
  getToken: GetToken;
  paperId: string;
};

// 한 문제지의 결과표(학생 이름·점수·틀린 문항)와 평균 점수
// 평균 = 최종 제출이 저장된 학생 점수 합 ÷ 제출 학생 수. 같은 이름은 최신 결과 1개만 들어갑니다.
export default function PaperResults({ getToken, paperId }: Props) {
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    teacherFetch<Results>(getToken, `/api/teacher/papers/${paperId}/results`)
      .then((r) => {
        if (!active) return;
        setResults(r);
        setError(null);
      })
      .catch((e) => {
        if (active) setError(errorMessages(e).join(" "));
      });
    return () => {
      active = false;
    };
  }, [getToken, paperId, reload]);

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  }
  if (!results) return <p className="muted">결과를 불러오는 중입니다…</p>;

  if (results.rows.length === 0) {
    return (
      <div className="results-box">
        <p className="notice">아직 제출한 학생이 없습니다.</p>
        <ReloadButton onClick={() => setReload((n) => n + 1)} />
      </div>
    );
  }

  return (
    <div className="results-box">
      <p>
        제출 학생 {results.rows.length}명 · 평균 <strong>{results.average}점</strong>
      </p>
      <p className="muted small">
        평균은 최종 제출한 학생들의 점수 합계 ÷ 제출 학생 수입니다. 같은 이름으로 다시 풀면 가장 최근 결과 하나만 들어갑니다.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>학생 이름</th>
              <th>점수</th>
              <th>틀린 문항</th>
            </tr>
          </thead>
          <tbody>
            {results.rows.map((r) => (
              <tr key={r.studentName}>
                <td>{r.studentName}</td>
                <td>{r.score}점</td>
                <td>
                  {r.wrong.length === 0 ? (
                    "없음"
                  ) : (
                    <ul className="wrong-list">
                      {r.wrong.map((w) => (
                        <li key={w.number}>
                          <strong>{w.number}번</strong> {w.question ?? <span className="muted">(문항 정보를 찾을 수 없음)</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ReloadButton onClick={() => setReload((n) => n + 1)} />
    </div>
  );
}

function ReloadButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="nav">
      <button type="button" className="button small" onClick={onClick}>
        결과 새로고침
      </button>
    </div>
  );
}
