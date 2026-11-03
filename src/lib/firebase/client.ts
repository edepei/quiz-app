import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// 브라우저에서 쓰는 Firebase 웹 앱 설정입니다. 공개돼도 되는 값이며 .env.local에 넣습니다.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(config).every(Boolean);

// 설정값이 없으면 null을 돌려줍니다(교사 화면에 "준비 중" 안내를 띄움).
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) return null;
  const app = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}
