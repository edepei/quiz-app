"use client";

import { useState } from "react";
import PaperListStep from "@/components/quiz/PaperListStep";
import QuestionStep from "@/components/quiz/QuestionStep";
import ReadyStep from "@/components/quiz/ReadyStep";
import ResultStep from "@/components/quiz/ResultStep";
import type { Answers, GradeResult, StudentPaper } from "@/lib/quiz/types";

type Step = "list" | "ready" | "solving" | "result";

type Props = {
  studentName: string;
  papers: StudentPaper[];
  loadError: string | null;
};

// 최종 제출 때 한 번만 서버에 보냅니다. 서버가 채점·저장한 뒤 점수와 정답·해설을 돌려줍니다.
async function submitAnswers(paperId: string, studentName: string, answers: Answers): Promise<GradeResult> {
  let res: Response;
  try {
    res = await fetch("/api/student/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paperId, studentName, answers }),
    });
  } catch {
    throw new Error("인터넷 연결이 끊겨 결과를 저장하지 못했습니다.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.result) throw new Error(data?.error ?? "결과를 저장하지 못했습니다.");
  return data.result;
}

export default function QuizApp({ studentName, papers, loadError }: Props) {
  const [step, setStep] = useState<Step>("list");
  const [paper, setPaper] = useState<StudentPaper | null>(null);
  const [answers, setAnswers] = useState<Answers>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questions = paper?.questions ?? [];

  function go(next: Step) {
    setStep(next);
    window.scrollTo(0, 0);
  }

  function startSolving() {
    setAnswers(questions.map(() => null));
    setIndex(0);
    setResult(null);
    setSubmitError(null);
    go("solving");
  }

  function backToList() {
    setPaper(null);
    go("list");
  }

  async function submit() {
    if (!paper || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      setResult(await submitAnswers(paper.id, studentName, answers));
      go("result");
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {step === "list" && (
        <PaperListStep
          papers={papers}
          loadError={loadError}
          onSelect={(p) => {
            setPaper(p);
            go("ready");
          }}
        />
      )}

      {step === "ready" && paper && (
        <ReadyStep title={paper.title} total={questions.length} onStart={startSolving} onBack={backToList} />
      )}

      {step === "solving" && (
        <QuestionStep
          questions={questions}
          answers={answers}
          index={index}
          onChoose={(choice) => setAnswers((prev) => prev.map((a, i) => (i === index ? choice : a)))}
          onMove={(i) => {
            setIndex(i);
            window.scrollTo(0, 0);
          }}
          onSubmit={submit}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      {step === "result" && result && (
        <ResultStep result={result} onRetry={startSolving} onBackToList={backToList} />
      )}
    </>
  );
}
