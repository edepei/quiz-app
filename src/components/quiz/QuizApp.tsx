"use client";

import { useState } from "react";
import PaperListStep from "@/components/quiz/PaperListStep";
import QuestionStep from "@/components/quiz/QuestionStep";
import ReadyStep from "@/components/quiz/ReadyStep";
import ResultStep from "@/components/quiz/ResultStep";
import { gradeQuiz } from "@/lib/quiz/grade";
import type { Answers, GradeResult, InvalidPaper, QuestionPaper } from "@/lib/quiz/types";

type Step = "list" | "ready" | "solving" | "result";

type Props = {
  papers: QuestionPaper[];
  invalid: InvalidPaper[];
};

export default function QuizApp({ papers, invalid }: Props) {
  const [step, setStep] = useState<Step>("list");
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [answers, setAnswers] = useState<Answers>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<GradeResult | null>(null);

  const questions = paper?.questions ?? [];

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

  function backToList() {
    setPaper(null);
    go("list");
  }

  return (
    <main className="container">
      {step === "list" && (
        <PaperListStep
          papers={papers}
          invalid={invalid}
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
          onSubmit={() => {
            setResult(gradeQuiz(questions, answers));
            go("result");
          }}
        />
      )}

      {step === "result" && result && (
        <ResultStep result={result} onRetry={startSolving} onBackToList={backToList} />
      )}
    </main>
  );
}
