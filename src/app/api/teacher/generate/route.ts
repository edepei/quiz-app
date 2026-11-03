import { aiFailureMessage, aiFailureStatus, generatePaperText } from "@/lib/ai/azure";
import { validateGeneratedText } from "@/lib/ai/generated";
import { getDb } from "@/lib/firebase/admin";
import { readPdfText } from "@/lib/pdf/extract";
import { checkPdfSize } from "@/lib/pdf/limits";
import { listPapersForTeacher } from "@/lib/store/firestore";
import { titleKey } from "@/lib/store/records";
import { storeFailed, storeNotReady } from "@/lib/store/responses";
import { requireTeacher } from "@/lib/teacher/guard";

// AI 응답을 기다리는 시간(최대 2분)보다 넉넉하게 둡니다.
export const maxDuration = 180;

// PDF 학습자료 → 본문 읽기 → Azure AI로 제목·10문항 생성 → 형식 검사 후 돌려줍니다.
// 여기서는 저장하지 않고 PDF도 보관하지 않습니다. 저장은 교사가 확인한 뒤 POST /api/teacher/papers로 합니다.
export async function POST(request: Request) {
  const teacher = await requireTeacher(request);
  if (!teacher.ok) return teacher.response;
  const db = getDb();
  if (!db) return storeNotReady();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ errors: ["PDF 파일을 받지 못했습니다. 파일을 다시 골라 주세요."] }, { status: 400 });
  // 큰 파일은 내용을 읽기 전에 거절합니다.
  const sizeError = checkPdfSize(file.size);
  if (sizeError) return Response.json({ errors: [sizeError] }, { status: 400 });

  const pdf = await readPdfText(new Uint8Array(await file.arrayBuffer()));
  if (!pdf.ok) return Response.json({ errors: [pdf.error] }, { status: 400 });

  let existingTitles: string[];
  try {
    existingTitles = (await listPapersForTeacher(db)).map((p) => p.title);
  } catch (e) {
    return storeFailed(e);
  }

  const ai = await generatePaperText(pdf.text, existingTitles);
  if (!ai.ok) {
    return Response.json(
      { reason: ai.reason, errors: [aiFailureMessage(ai.reason, ai.retryAfterSeconds)] },
      { status: aiFailureStatus(ai.reason) },
    );
  }

  const checked = validateGeneratedText(ai.text);
  if (!checked.ok) {
    return Response.json(
      { reason: "format", errors: ["AI가 만든 문제지가 형식에 맞지 않아 쓸 수 없습니다. \"문제 만들기\"를 다시 눌러 주세요.", ...checked.errors] },
      { status: 502 },
    );
  }

  const paper = { title: checked.title.trim(), questions: checked.questions };
  const key = titleKey(paper.title);
  const duplicateOf = existingTitles.find((t) => titleKey(t) === key) ?? null;
  return Response.json({ paper, duplicateOf, chars: pdf.chars, pages: pdf.pages });
}
