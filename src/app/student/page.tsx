import StudentApp from "@/components/student/StudentApp";
import { getDb } from "@/lib/firebase/admin";
import type { StudentPaper } from "@/lib/quiz/types";
import { listPublishedPapers } from "@/lib/store/firestore";

// 교사가 공개한 문제지를 열 때마다 새로 읽습니다. 정답·해설은 빼고 화면에 넘깁니다.
export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const db = getDb();
  let papers: StudentPaper[] = [];
  let loadError: string | null = null;
  if (!db) {
    loadError = "문제 목록이 아직 준비되지 않았습니다. 선생님께 문의해 주세요.";
  } else {
    try {
      papers = await listPublishedPapers(db);
    } catch (e) {
      console.error(e);
      loadError = "문제 목록을 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.";
    }
  }
  return <StudentApp papers={papers} loadError={loadError} />;
}
