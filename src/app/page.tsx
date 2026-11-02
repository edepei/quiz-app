"use client";

import { useState } from "react";
import QuestionStep from "@/components/quiz/QuestionStep";
import ReadyStep from "@/components/quiz/ReadyStep";
import ResultStep from "@/components/quiz/ResultStep";
import UploadStep from "@/components/quiz/UploadStep";
import { gradeQuiz } from "@/lib/quiz/grade";
import type { Answers, GradeResult, Question } from "@/lib/quiz/types";

type Step = "upload" | "ready" | "solving" | "result";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fileName, setFileName] = useState("");
  const [answers, setAnswers] = useState<Answers>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<GradeResult | null>(null);

  function go(next: Step) {
    setStep(next);
    window.scrollTo(0, 0);
  }

  function startSolving() {
    setAnswers(questions.map(() => null));
    setIndex(0);
    setResult(null);
    go("solving");
  }

  return (
    <main className="container">
      {step === "upload" && (
        <UploadStep
          onLoaded={(qs, name) => {
            setQuestions(qs);
            setFileName(name);
            go("ready");
          }}
        />
      )}

      {step === "ready" && <ReadyStep fileName={fileName} total={questions.length} onStart={startSolving} />}

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
          onSubmit={() => {
            setResult(gradeQuiz(questions, answers));
            go("result");
          }}
        />
      )}

      {step === "result" && result && (
        <ResultStep
          result={result}
          onRetry={startSolving}
          onNewFile={() => {
            setQuestions([]);
            setFileName("");
            go("upload");
          }}
        />
      )}
    </main>
  );
}
