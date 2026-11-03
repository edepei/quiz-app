import { extractText, getDocumentProxy } from "unpdf";
import { checkPdfSize, checkTextLength, countChars, looksLikePdf, normalizeText } from "./limits";

// 서버 전용: 올라온 PDF를 검사하고 본문 글자를 읽습니다. 파일은 어디에도 보관하지 않습니다.

export type PdfText = { ok: true; text: string; chars: number; pages: number } | { ok: false; error: string };

export async function readPdfText(bytes: Uint8Array): Promise<PdfText> {
  const sizeError = checkPdfSize(bytes.length);
  if (sizeError) return { ok: false, error: sizeError };
  if (!looksLikePdf(bytes)) return { ok: false, error: "PDF 파일만 올릴 수 있습니다. 파일 형식을 확인해 주세요." };

  let raw: string;
  let pages: number;
  try {
    // PDF 도구가 넘겨준 자료를 바꿀 수 있어 복사본을 넘깁니다.
    const pdf = await getDocumentProxy(bytes.slice());
    try {
      ({ text: raw, totalPages: pages } = await extractText(pdf, { mergePages: true }));
    } finally {
      await pdf.loadingTask.destroy();
    }
  } catch (e) {
    if ((e as { name?: string }).name === "PasswordException") {
      return { ok: false, error: "암호가 걸린 PDF는 읽을 수 없습니다. 암호를 푼 PDF를 올려 주세요." };
    }
    return { ok: false, error: "PDF 파일이 손상되었거나 읽을 수 없는 형식입니다. 다른 PDF 파일을 올려 주세요." };
  }

  const text = normalizeText(raw);
  const lengthError = checkTextLength(text);
  if (lengthError) return { ok: false, error: lengthError };
  return { ok: true, text, chars: countChars(text), pages };
}
