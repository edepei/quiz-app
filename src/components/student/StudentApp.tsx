"use client";

import Link from "next/link";
import { useState } from "react";
import QuizApp from "@/components/quiz/QuizApp";
import NameStep from "@/components/student/NameStep";
import type { InvalidPaper, QuestionPaper } from "@/lib/quiz/types";

type Props = {
  papers: QuestionPaper[];
  invalid: InvalidPaper[];
};

// 학생 이름은 화면에만 들고 있습니다. 저장하지 않으므로 새로고침하면 이름부터 다시 입력합니다.
export default function StudentApp({ papers, invalid }: Props) {
  const [name, setName] = useState<string | null>(null);

  return (
    <main className="container">
      <header className="topbar">
        <span className="topbar-name">{name ? `${name} 학생` : "학생 입장"}</span>
        <Link href="/" className="button small">
          첫 화면으로
        </Link>
      </header>

      {name ? <QuizApp papers={papers} invalid={invalid} /> : <NameStep onEnter={setName} />}
    </main>
  );
}
