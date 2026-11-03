// 학생 이름 입력값을 정리합니다. 앞뒤 공백을 지우고, 비어 있으면 null을 돌려줍니다.
export function normalizeStudentName(input: string): string | null {
  const name = input.trim();
  return name === "" ? null : name;
}
