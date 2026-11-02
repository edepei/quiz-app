import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { InvalidPaper, QuestionPaper } from "./types";
import { validatePaperText } from "./validate";

export const PAPERS_DIR = join(process.cwd(), "question-papers");

/**
 * question-papers 폴더의 .json 문제지를 모두 읽습니다(파일 이름 순).
 * 형식이 맞지 않는 파일은 목록에서 빼고, 이유와 함께 invalid로 돌려줍니다.
 * 홈 화면은 빌드할 때 한 번 읽어 고정 페이지로 만들므로, 서버 실행용 파일 추적에서는 제외합니다.
 */
export async function loadQuestionPapers(
  dir: string = PAPERS_DIR,
): Promise<{ papers: QuestionPaper[]; invalid: InvalidPaper[] }> {
  let names: string[];
  try {
    names = await readdir(/*turbopackIgnore: true*/ dir);
  } catch {
    return { papers: [], invalid: [] };
  }

  const papers: QuestionPaper[] = [];
  const invalid: InvalidPaper[] = [];
  for (const fileName of names.filter((n) => n.toLowerCase().endsWith(".json")).sort()) {
    const result = validatePaperText(await readFile(/*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ dir, fileName), "utf8"));
    if (result.ok) {
      papers.push({ id: fileName, title: result.title, questions: result.questions });
    } else {
      invalid.push({ fileName, errors: result.errors });
    }
  }
  return { papers, invalid };
}
