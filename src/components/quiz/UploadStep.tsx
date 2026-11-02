"use client";

import { useState } from "react";
import type { Question } from "@/lib/quiz/types";
import { validateQuizText } from "@/lib/quiz/validate";

type Props = {
  onLoaded: (questions: Question[], fileName: string) => void;
};

export default function UploadStep({ onLoaded }: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const [errorFile, setErrorFile] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    // 같은 파일을 고쳐서 다시 고를 수 있도록 선택 칸을 비웁니다.
    input.value = "";

    let text: string;
    try {
      text = await file.text();
    } catch {
      setErrorFile(file.name);
      setErrors(["파일을 열 수 없습니다. 다른 파일을 골라 주세요."]);
      return;
    }

    const result = validateQuizText(text);
    if (!result.ok) {
      setErrorFile(file.name);
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    onLoaded(result.questions, file.name);
  }

  return (
    <section className="card">
      <h1>문제 풀기</h1>
      <p>선생님께 받은 문제 파일(JSON)을 올려 주세요.</p>
      <p className="muted">파일을 올리면 문제를 한 문제씩 풀 수 있습니다. 모든 문제를 풀면 점수와 해설을 보여 드립니다.</p>

      <label className="button primary file-button">
        파일 선택
        <input type="file" accept=".json,application/json" onChange={handleChange} />
      </label>

      {errors.length > 0 && (
        <div className="error" role="alert">
          <p>
            <strong>{errorFile}</strong> 파일을 사용할 수 없습니다. 아래 내용을 고친 뒤 다시 올려 주세요.
          </p>
          <ul>
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
