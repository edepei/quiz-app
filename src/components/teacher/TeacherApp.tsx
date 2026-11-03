"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import { getFirebaseAuth } from "@/lib/firebase/client";

type State =
  | { kind: "loading" }
  | { kind: "not-configured" }
  | { kind: "signed-out"; message?: string }
  | { kind: "allowed"; email: string; user: User }
  | { kind: "denied"; email: string | null }
  | { kind: "error" };

// 로그인 증명을 서버에 보내 허용된 교사인지 확인합니다. 화면만 믿지 않고 서버 답을 따릅니다.
async function checkWithServer(user: User): Promise<State> {
  try {
    const res = await fetch("/api/teacher/me", {
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      cache: "no-store",
    });
    if (res.ok) return { kind: "allowed", email: (await res.json()).email, user };
    if (res.status === 403) return { kind: "denied", email: user.email };
    if (res.status === 503) return { kind: "not-configured" };
    return { kind: "error" };
  } catch {
    return { kind: "error" };
  }
}

const SIGN_IN_ERRORS: Record<string, string> = {
  "auth/popup-closed-by-user": "로그인 창이 닫혔습니다. 다시 눌러 주세요.",
  "auth/cancelled-popup-request": "로그인 창이 닫혔습니다. 다시 눌러 주세요.",
  "auth/popup-blocked": "브라우저가 로그인 창을 막았습니다. 팝업 허용 후 다시 눌러 주세요.",
  "auth/unauthorized-domain": "이 주소는 아직 Firebase 로그인 허용 주소에 등록되지 않았습니다.",
};

export default function TeacherApp() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const auth = getFirebaseAuth();

  useEffect(() => {
    if (!auth) {
      setState({ kind: "not-configured" });
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState((prev) => (prev.kind === "signed-out" ? prev : { kind: "signed-out" }));
        return;
      }
      setState({ kind: "loading" });
      setState(await checkWithServer(user));
    });
  }, [auth]);

  async function signIn() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      setState({ kind: "signed-out", message: SIGN_IN_ERRORS[code] ?? "로그인하지 못했습니다. 잠시 뒤 다시 눌러 주세요." });
    }
  }

  async function logOut() {
    if (auth) await signOut(auth);
    setState({ kind: "signed-out", message: "로그아웃했습니다." });
  }

  switch (state.kind) {
    case "loading":
      return (
        <section className="card">
          <p className="muted">확인하는 중입니다…</p>
        </section>
      );

    case "not-configured":
      return (
        <section className="card">
          <h1>교사 로그인</h1>
          <p className="notice">교사 로그인이 아직 준비되지 않았습니다. 관리자가 Firebase 설정을 마치면 사용할 수 있습니다.</p>
        </section>
      );

    case "allowed":
      return <TeacherDashboard email={state.email} user={state.user} onSignOut={logOut} />;

    case "denied":
      return (
        <section className="card">
          <h1>교사 로그인</h1>
          <div className="error" role="alert">
            <p>허용되지 않은 계정입니다.</p>
            <p>{state.email ?? "이 계정"}은(는) 교사로 등록되어 있지 않아 교사 화면에 들어갈 수 없습니다.</p>
          </div>
          <div className="nav">
            <button type="button" className="button primary" onClick={logOut}>
              로그아웃하고 다른 계정으로 로그인
            </button>
          </div>
        </section>
      );

    case "error":
      return (
        <section className="card">
          <h1>교사 로그인</h1>
          <p className="error" role="alert">로그인 상태를 확인하지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.</p>
          <div className="nav">
            <button type="button" className="button" onClick={logOut}>
              로그아웃
            </button>
          </div>
        </section>
      );

    case "signed-out":
      return (
        <section className="card">
          <h1>교사 로그인</h1>
          <p>교사로 등록된 Google 계정으로 로그인해 주세요.</p>
          {state.message && <p className="notice">{state.message}</p>}
          <div className="nav">
            <button type="button" className="button primary" onClick={signIn}>
              Google로 로그인
            </button>
          </div>
        </section>
      );
  }
}
