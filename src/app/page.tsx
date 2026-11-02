import QuizApp from "@/components/quiz/QuizApp";
import { loadQuestionPapers } from "@/lib/quiz/papers";

export default async function Home() {
  const { papers, invalid } = await loadQuestionPapers();
  return <QuizApp papers={papers} invalid={invalid} />;
}
