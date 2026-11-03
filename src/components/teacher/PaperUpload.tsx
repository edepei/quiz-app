"use client";

import { useRef, useState } from "react";
import type { Question } from "@/lib/quiz/types";
import { validatePaperText } from "@/lib/quiz/validate";
import { errorMessages, teacherFetch, type GetToken } from "./api";
import PaperPreview from "./PaperPreview";

type Preview = { fileName: string; text: string; title: string; questions: Question[] };

type Props = {
  getToken: GetToken;
  onSaved: () => void;
};

// 문제지 JSON 파일을 골라 내용을 확인한 뒤 저장합니다. 저장한 문제지는 비공개로 시작합니다.
export default function PaperUpload({ getToken, onSaved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setPreview(null);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function pick(file: File | undefined) {
    setErrors([]);
    setMessage(null);
    setPreview(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setErrors(["JSON 파일(.json)만 올릴 수 있습니다."]);
      return;
    }
    const text = await file.text();
    const checked = validatePaperText(text);
    if (!checked.ok) {
      setErrors(checked.errors);
      return;
    }
    setPreview({ fileName: file.name, text, title: checked.title, questions: checked.questions });
  }

  async function save() {
    if (!preview) return;
    setSaving(true);
    setErrors([]);
    try {
      await teacherFetch(getToken, "/api/teacher/papers", {
        method: "POST",
        body: JSON.stringify({ text: preview.text, fileName: preview.fileName }),
      });
      setMessage(`"${preview.title}" 문제지를 저장했습니다. 아래 목록에서 "공개하기"를 누르면 학생에게 보입니다.`);
      reset();
      onSaved();
    } catch (e) {
      setErrors(errorMessages(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <h2>문제지 올리기</h2>
      <p className="muted">문제지 JSON 파일을 고르면 내용을 먼저 보여 드립니다. 확인한 뒤 &quot;저장하기&quot;를 눌러 주세요.</p>
      <label htmlFor="paper-file" className="label">
        문제지 파일
      </label>
      <input
        id="paper-file"
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="input"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {message && <p className="notice">{message}</p>}

      {errors.length > 0 && (
        <div className="error" role="alert">
          <p>이 파일은 저장할 수 없습니다.</p>
          <ul>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {preview && (
        <div className="preview">
          <p>
            <strong>{preview.title}</strong> · {preview.questions.length}문항
          </p>
          <PaperPreview questions={preview.questions} />
          <div className="nav">
            <button type="button" className="button" onClick={reset} disabled={saving}>
              취소
            </button>
            <button type="button" className="button primary" onClick={save} disabled={saving}>
              {saving ? "저장하는 중…" : "저장하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
