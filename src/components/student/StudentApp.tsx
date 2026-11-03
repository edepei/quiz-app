"use client";

import Link from "next/link";
import { useState } from "react";
import QuizApp from "@/components/quiz/QuizApp";
import NameStep from "@/components/student/NameStep";
import type { StudentPaper } from "@/lib/quiz/types";

type Props = {
  papers: StudentPaper[];
  loadError: string | null;
};

// 학생 이름은 화면에만 들고 있다가 최종 제출할 때 결과와 함께 저장합니다. 새로고침하면 이름부터 다시 입력합니다.
export default function StudentApp({ papers, loadError }: Props) {
  const [name, setName] = useState<string | null>(null);

  return (
    <main className="container">
      <header className="topbar">
        <span className="topbar-name">{name ? `${name} 학생` : "학생 입장"}</span>
        <Link href="/" className="button small">
          첫 화면으로
        </Link>
      </header>

      {name ? <QuizApp studentName={name} papers={papers} loadError={loadError} /> : <NameStep onEnter={setName} />}
    </main>
  );
}
