"use client";

import { useRef, useState } from "react";
import { checkPdfSize } from "@/lib/pdf/limits";
import type { Question } from "@/lib/quiz/types";
import { errorMessages, teacherFetch, type GetToken } from "./api";
import PaperPreview from "./PaperPreview";

type Generated = { paper: { title: string; questions: Question[] }; duplicateOf: string | null; chars: number; pages: number };
type Result = Generated & { fileName: string };

type Props = {
  getToken: GetToken;
  onSaved: () => void;
};

// PDF 학습자료로 AI가 제목·10문항을 만들고, 교사가 확인한 뒤 "저장하고 공개하기" 또는 "취소"를 고릅니다.
// 만든 내용을 고치는 기능은 없습니다. PDF는 서버에서 글자만 읽고 보관하지 않습니다.
export default function PdfGenerate({ getToken, onSaved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"generating" | "saving" | null>(null);

  function backToUpload() {
    setResult(null);
    setFile(null);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pick(picked: File | undefined) {
    setErrors([]);
    setMessage(null);
    setFile(null);
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith(".pdf")) {
      setErrors(["PDF 파일(.pdf)만 올릴 수 있습니다."]);
      return;
    }
    const sizeError = checkPdfSize(picked.size);
    if (sizeError) {
      setErrors([sizeError]);
      return;
    }
    setFile(picked);
  }

  // 한 번에 하나만 실행합니다. 버튼을 여러 번 눌러도 요청은 한 번만 갑니다.
  async function run(kind: "generating" | "saving", task: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(kind);
    setErrors([]);
    try {
      await task();
    } catch (e) {
      setErrors(errorMessages(e));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  const generate = () =>
    run("generating", async () => {
      if (!file) return;
      const form = new FormData();
      form.append("file", file);
      const generated = await teacherFetch<Generated>(getToken, "/api/teacher/generate", { method: "POST", body: form });
      setResult({ ...generated, fileName: file.name });
    });

  const save = () =>
    run("saving", async () => {
      if (!result || result.duplicateOf) return;
      await teacherFetch(getToken, "/api/teacher/papers", {
        method: "POST",
        body: JSON.stringify({ text: JSON.stringify(result.paper), fileName: result.fileName, source: "pdf-ai" }),
      });
      setMessage(`"${result.paper.title}" 문제지를 저장하고 학생 목록에 공개했습니다.`);
      backToUpload();
      onSaved();
    });

  const generating = busy === "generating";

  return (
    <div className="panel">
      <h2>PDF로 문제 만들기</h2>
      <p className="muted">
        글자를 선택·복사할 수 있는 PDF 학습자료(512KB 이하, 본문 300~12,000자)를 고르면 AI가 문제지 제목과 4지선다 10문항을 만듭니다.
        스캔하거나 사진으로 만든 PDF는 지원하지 않습니다.
      </p>

      {message && <p className="notice">{message}</p>}

      {!result && (
        <>
          <label htmlFor="pdf-file" className="label">
            학습자료 PDF
          </label>
          <input
            id="pdf-file"
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="input"
            disabled={generating}
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <div className="nav">
            <button type="button" className="button primary" onClick={generate} disabled={!file || generating}>
              {generating ? "만드는 중…" : "문제 만들기"}
            </button>
          </div>
          {generating && (
            <p className="notice" role="status">
              AI가 문제를 만들고 있습니다. 1~2분 정도 걸릴 수 있으니 이 화면을 닫지 말고 기다려 주세요.
            </p>
          )}
        </>
      )}

      {errors.length > 0 && (
        <div className="error" role="alert">
          <p>{result ? "저장하지 못했습니다." : "문제를 만들지 못했습니다."}</p>
          <ul>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="preview">
          <p className="notice">
            AI가 만든 내용입니다. 저장하기 전에 문제·정답·해설이 PDF 내용과 맞는지 직접 확인해 주세요. 형식 검사는 통과했지만 내용이 정확한지는 확인하지 않았습니다.
          </p>
          <p>
            <strong>{result.paper.title}</strong> · {result.paper.questions.length}문항
          </p>
          <p className="muted small">
            자료: {result.fileName} ({result.pages}쪽, 본문 {result.chars.toLocaleString("ko-KR")}자)
          </p>
          {result.duplicateOf && (
            <p className="error" role="alert">
              이미 등록된 문제지 &quot;{result.duplicateOf}&quot;와(과) 제목이 같아 저장할 수 없습니다. &quot;취소&quot;를 누른 뒤 PDF를 다시 올려 새로 만들어 주세요.
            </p>
          )}
          <PaperPreview questions={result.paper.questions} />
          <div className="nav">
            <button type="button" className="button" onClick={backToUpload} disabled={busy === "saving"}>
              취소
            </button>
            <button type="button" className="button primary" onClick={save} disabled={busy === "saving" || !!result.duplicateOf}>
              {busy === "saving" ? "저장하는 중…" : "저장하고 공개하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
