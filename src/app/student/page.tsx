import StudentApp from "@/components/student/StudentApp";
import { loadQuestionPapers } from "@/lib/quiz/papers";

export default async function StudentPage() {
  const { papers, invalid } = await loadQuestionPapers();
  return <StudentApp papers={papers} invalid={invalid} />;
}
