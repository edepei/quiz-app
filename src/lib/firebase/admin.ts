import { applicationDefault, cert, getApp, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// 서버에서만 쓰는 Firestore 연결입니다. 서비스 계정 키(비밀값)는 코드에 넣지 않고 설정값으로 받습니다.
// - 내 컴퓨터: GOOGLE_APPLICATION_CREDENTIALS = 프로젝트 폴더 밖에 둔 키 파일 위치
// - 배포 서비스: FIREBASE_SERVICE_ACCOUNT_KEY = 키 파일 내용 전체
const APP_NAME = "quiz-server";

export function isAdminConfigured(): boolean {
  return !!(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

/** 설정값이 없으면 null을 돌려줍니다(화면에 "준비 중" 안내를 띄움). */
export function getDb(): Firestore | null {
  if (!isAdminConfigured()) return null;
  if (getApps().some((app) => app.name === APP_NAME)) return getFirestore(getApp(APP_NAME));

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const app = initializeApp(
    {
      credential: key ? cert(JSON.parse(key) as ServiceAccount) : applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    },
    APP_NAME,
  );
  return getFirestore(app);
}
