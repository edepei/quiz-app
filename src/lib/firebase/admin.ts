import { applicationDefault, cert, getApp, getApps, initializeApp, type Credential, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// 서버에서만 쓰는 Firestore 연결입니다. 서비스 계정 키(비밀값)는 코드에 넣지 않고 설정값으로 받습니다.
// - 내 컴퓨터: GOOGLE_APPLICATION_CREDENTIALS = 프로젝트 폴더 밖에 둔 키 파일 위치
// - 배포 서비스(Vercel): FIREBASE_SERVICE_ACCOUNT_KEY = 키 파일 내용 전체. Vercel에는 내 컴퓨터의 파일 경로가 없으므로 경로 방식은 쓰지 않습니다.
const APP_NAME = "quiz-server";

type Env = Record<string, string | undefined>;

export type CredentialSource =
  | { ok: true; kind: "key"; account: ServiceAccount }
  | { ok: true; kind: "file" }
  | { ok: false; reason: "missing" | "invalid-key" | "wrong-project" };

/** 어떤 방식으로 연결할지 정합니다. 문제가 있으면 이유만 돌려주고, 키 내용은 어디에도 출력하지 않습니다. */
export function readCredentialSource(env: Env = process.env): CredentialSource {
  const key = env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    let parsed: { project_id?: unknown; client_email?: unknown; private_key?: unknown };
    try {
      parsed = JSON.parse(key);
    } catch {
      return { ok: false, reason: "invalid-key" };
    }
    if (typeof parsed?.client_email !== "string" || typeof parsed.private_key !== "string") {
      return { ok: false, reason: "invalid-key" };
    }
    // 같은 이름의 다른 Firebase 프로젝트 키를 넣는 실수를 막습니다.
    if (env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && parsed.project_id !== env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return { ok: false, reason: "wrong-project" };
    }
    return {
      ok: true,
      kind: "key",
      account: { projectId: parsed.project_id as string, clientEmail: parsed.client_email, privateKey: parsed.private_key },
    };
  }
  if (env.GOOGLE_APPLICATION_CREDENTIALS && !env.VERCEL) return { ok: true, kind: "file" };
  return { ok: false, reason: "missing" };
}

const PROBLEM: Record<"invalid-key" | "wrong-project", string> = {
  "invalid-key": "FIREBASE_SERVICE_ACCOUNT_KEY 값이 서비스 계정 키 파일 내용(JSON 전체)이 아닙니다.",
  "wrong-project": "FIREBASE_SERVICE_ACCOUNT_KEY가 NEXT_PUBLIC_FIREBASE_PROJECT_ID와 다른 Firebase 프로젝트의 키입니다.",
};
let reported = false;

/** 설정값이 없거나 잘못되면 null을 돌려줍니다(화면에 "준비 중" 안내를 띄움). */
export function getDb(): Firestore | null {
  if (getApps().some((app) => app.name === APP_NAME)) return getFirestore(getApp(APP_NAME));

  const source = readCredentialSource();
  if (!source.ok) {
    if (source.reason !== "missing" && !reported) {
      reported = true;
      console.error(`Firestore 연결 설정 오류: ${PROBLEM[source.reason]}`);
    }
    return null;
  }
  const credential: Credential = source.kind === "key" ? cert(source.account) : applicationDefault();
  const app = initializeApp({ credential, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }, APP_NAME);
  return getFirestore(app);
}
