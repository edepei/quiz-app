// PDF 학습자료의 교육용 입력 기준(교안)입니다. 플랫폼 공통 한도가 아니라 이 앱이 정한 기준이며,
// 넘으면 AI를 부르기 전에 이유를 알려 주고 거절합니다. 본문을 몰래 잘라 쓰지 않습니다.
// 교사 화면(미리 확인)과 서버(최종 확인)가 함께 씁니다.

export const MAX_PDF_BYTES = 524_288; // 512KiB
export const MAX_TEXT_CHARS = 12_000;
export const MIN_TEXT_CHARS = 300;

const kb = (bytes: number) => Math.ceil(bytes / 1024);

/** 파일 크기만 봅니다. 문제가 없으면 null. */
export function checkPdfSize(size: number): string | null {
  if (size === 0) return "파일이 비어 있습니다. 다른 PDF 파일을 골라 주세요.";
  if (size > MAX_PDF_BYTES) return `PDF 파일이 512KB보다 큽니다. (지금 ${kb(size)}KB) 더 작은 파일로 나눠서 올려 주세요.`;
  return null;
}

/** 파일 앞부분이 PDF 표시(%PDF-)로 시작하는지 봅니다. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  return head.includes("%PDF-");
}

/** 연속된 공백과 빈 줄만 하나로 정리합니다. 글자 내용은 지우거나 자르지 않습니다. */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v 　]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

/** 글자 수(한글 한 글자 = 1). */
export const countChars = (text: string) => [...text].length;

/** 정리한 본문의 길이를 봅니다. 문제가 없으면 null. */
export function checkTextLength(text: string): string | null {
  const chars = countChars(text);
  if (chars === 0) return "PDF에서 글자를 찾지 못했습니다. 스캔하거나 사진으로 만든 PDF는 지원하지 않습니다. 글자를 선택·복사할 수 있는 PDF를 올려 주세요.";
  if (chars < MIN_TEXT_CHARS) return `본문이 ${chars}자로 너무 짧아 10문항을 만들 수 없습니다. ${MIN_TEXT_CHARS}자 이상인 자료를 올려 주세요.`;
  if (chars > MAX_TEXT_CHARS) return `본문이 ${chars.toLocaleString("ko-KR")}자로, ${MAX_TEXT_CHARS.toLocaleString("ko-KR")}자를 넘습니다. 자료를 나눠서 올려 주세요.`;
  return null;
}
