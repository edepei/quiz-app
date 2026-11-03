"use client";

import { useEffect, useState } from "react";
import type { ResultRow } from "@/lib/store/firestore";
import { errorMessages, teacherFetch, type GetToken } from "./api";

type Results = { title: string; questionCount: number; rows: ResultRow[]; average: number | null };

type Props = {
  getToken: GetToken;
  paperId: string;
};

const timeText = (iso: string) =>
  iso ? new Date(iso).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "";

// 한 문제지의 학생별 최신 결과와 평균 점수
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

  return (
    <div className="results-box">
      <p>
        푼 학생 {results.rows.length}명 · 평균 <strong>{results.average === null ? "-" : `${results.average}점`}</strong>
      </p>
      <p className="muted small">같은 이름으로 다시 풀면 가장 최근 결과만 남고, 평균도 그 결과로 계산합니다.</p>
      {results.rows.length === 0 ? (
        <p className="notice">아직 이 문제지를 푼 학생이 없습니다.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>학생 이름</th>
                <th>점수</th>
                <th>틀린 문제</th>
                <th>완료 시각</th>
              </tr>
            </thead>
            <tbody>
              {results.rows.map((r) => (
                <tr key={r.studentName}>
                  <td>{r.studentName}</td>
                  <td>
                    {r.score}점{" "}
                    <span className="muted small">
                      ({r.correctCount}/{r.total})
                    </span>
                  </td>
                  <td>{r.wrongQuestions.length === 0 ? "없음" : r.wrongQuestions.map((n) => `${n}번`).join(", ")}</td>
                  <td className="muted small">{timeText(r.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="nav">
        <button type="button" className="button small" onClick={() => setReload((n) => n + 1)}>
          결과 새로고침
        </button>
      </div>
    </div>
  );
}
