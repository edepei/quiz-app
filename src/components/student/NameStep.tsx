"use client";

import { useState } from "react";
import { normalizeStudentName } from "@/lib/student/name";

type Props = {
  onEnter: (name: string) => void;
};

export default function NameStep({ onEnter }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeStudentName(value);
    if (name === null) {
      setError(true);
      return;
    }
    onEnter(name);
  }

  return (
    <section className="card">
      <h1>학생으로 시작하기</h1>
      <p>이름을 입력하고 &quot;들어가기&quot;를 눌러 주세요. 회원가입은 필요 없습니다.</p>
      <form onSubmit={submit} noValidate>
        <label htmlFor="student-name" className="label">
          이름
        </label>
        <input
          id="student-name"
          className="input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="예: 김민지"
          autoComplete="off"
          aria-invalid={error}
          aria-describedby={error ? "student-name-error" : undefined}
        />
        {error && (
          <p id="student-name-error" className="field-error" role="alert">
            이름을 입력해 주세요.
          </p>
        )}
        <div className="nav">
          <button type="submit" className="button primary">
            들어가기
          </button>
        </div>
      </form>
    </section>
  );
}
