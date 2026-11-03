import { describe, expect, it } from "vitest";
import { readPdfText } from "./extract";
import { MAX_PDF_BYTES, checkPdfSize, checkTextLength, normalizeText } from "./limits";

// 자동 점검용으로 아주 작은 PDF를 직접 만듭니다(한 쪽에 약 200줄까지). lines가 비어 있으면 글자가 없는 PDF(스캔 PDF와 같은 상태)가 됩니다.
function makePdf(lines: string[], extraTrailer = ""): Uint8Array {
  const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const content = lines.length
    ? `BT /F1 3 Tf 4 TL 20 830 Td ${lines.map((l) => `(${esc(l)}) Tj T*`).join(" ")} ET`
    : "0 0 1 rg 10 10 100 100 re f";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const at = out.length;
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R ${extraTrailer}>>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

const sentence = "Algorithms are step by step procedures for solving problems. ";
const linesOf = (chars: number) => {
  const text = sentence.repeat(Math.ceil(chars / sentence.length)).slice(0, chars);
  return text.match(/.{1,80}/g) ?? [];
};

describe("PDF 입력 기준", () => {
  it("512KiB(524,288바이트)까지 받고, 1바이트라도 넘으면 거절", () => {
    expect(checkPdfSize(MAX_PDF_BYTES)).toBeNull();
    expect(checkPdfSize(MAX_PDF_BYTES + 1)).toContain("512KB");
    expect(checkPdfSize(0)).toContain("비어 있습니다");
  });

  it("본문 300자 미만·12,000자 초과는 거절, 그 사이는 통과", () => {
    expect(checkTextLength("")).toContain("스캔");
    expect(checkTextLength("가".repeat(299))).toContain("너무 짧아");
    expect(checkTextLength("가".repeat(300))).toBeNull();
    expect(checkTextLength("가".repeat(12_000))).toBeNull();
    expect(checkTextLength("가".repeat(12_001))).toContain("12,000자를 넘습니다");
  });

  it("공백·빈 줄만 정리하고 글자는 지우지 않음", () => {
    expect(normalizeText("  가   나\t다 \r\n\r\n\r\n 라  ")).toBe("가 나 다\n\n라");
  });
});

describe("PDF 본문 읽기", () => {
  it("글자가 있는 표준 PDF는 본문을 읽음", async () => {
    const result = await readPdfText(makePdf(linesOf(1000)));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pages).toBe(1);
      expect(result.text).toContain("Algorithms are step by step");
      expect(result.chars).toBeGreaterThan(900);
    }
  });

  it("본문이 12,000자를 넘으면 자르지 않고 거절", async () => {
    const result = await readPdfText(makePdf(linesOf(12_500)));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("12,000자를 넘습니다") });
  });

  it("글자가 없는 PDF(스캔·사진 PDF)는 거절", async () => {
    const result = await readPdfText(makePdf([]));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("스캔") });
  });

  it("본문이 너무 짧으면 거절", async () => {
    const result = await readPdfText(makePdf(["Short text only."]));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("너무 짧아") });
  });

  it("PDF가 아닌 파일은 거절", async () => {
    const result = await readPdfText(new TextEncoder().encode('{"title":"문제지"}'));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("PDF 파일만") });
  });

  it("손상된 PDF는 거절", async () => {
    const result = await readPdfText(new TextEncoder().encode("%PDF-1.4\n이 파일은 깨졌습니다"));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("손상") });
  });

  it("암호가 걸린 PDF는 거절", async () => {
    const hex = (c: string) => `<${c.repeat(64)}>`;
    const encrypt = `/Encrypt << /Filter /Standard /V 1 /R 2 /O ${hex("a")} /U ${hex("b")} /P -4 >> /ID [<00112233445566778899aabbccddeeff> <00112233445566778899aabbccddeeff>] `;
    const result = await readPdfText(makePdf(linesOf(1000), encrypt));
    expect(result).toEqual({ ok: false, error: expect.stringContaining("암호") });
  });

  it("512KiB를 넘는 파일은 내용을 읽기 전에 거절", async () => {
    const big = new Uint8Array(MAX_PDF_BYTES + 1);
    big.set(new TextEncoder().encode("%PDF-1.4\n"));
    const result = await readPdfText(big);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("512KB") });
  });
});
