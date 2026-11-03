// 서버 창구들이 함께 쓰는 저장소 관련 응답입니다.
/** 서버 Firestore 설정이 아직 없을 때 */
export const storeNotReady = () =>
  Response.json({ error: "저장 기능이 아직 준비되지 않았습니다. 관리자가 Firestore 설정을 마치면 사용할 수 있습니다." }, { status: 503 });

/** Firestore 읽기·쓰기 중 예상하지 못한 오류 */
export function storeFailed(e: unknown) {
  console.error(e);
  return Response.json({ error: "저장소에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, { status: 500 });
}
