import { getDb } from "@/lib/firebase/admin";
import { getPublishedPaper, saveResult } from "@/lib/store/firestore";
import { buildResult, checkAnswers, parseSubmission } from "@/lib/store/records";
import { storeFailed, storeNotReady } from "@/lib/store/responses";

// 학생의 최종 제출. 서버가 채점해 저장한 뒤에만 점수·정답·해설을 돌려줍니다.
// 학생은 자기 결과만 받고, 다른 학생 결과를 읽는 창구는 없습니다.
export async function POST(request: Request) {
  const db = getDb();
  if (!db) return storeNotReady();

  const parsed = parseSubmission(await request.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    const paper = await getPublishedPaper(db, parsed.value.paperId);
    if (!paper) {
      return Response.json({ error: "이 문제지는 지금 풀 수 없습니다. 선생님께 문의해 주세요." }, { status: 404 });
    }
    const wrongCount = checkAnswers(parsed.value.answers, paper.questions.length);
    if (wrongCount) return Response.json({ error: wrongCount }, { status: 400 });

    const { record, graded } = buildResult(paper, parsed.value);
    await saveResult(db, record);
    return Response.json({ result: graded });
  } catch (e) {
    return storeFailed(e);
  }
}
