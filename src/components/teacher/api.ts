// 교사 화면에서 서버 창구를 부를 때 로그인 증명을 함께 보냅니다. 서버가 요청마다 허용된 교사인지 확인합니다.
export type GetToken = () => Promise<string>;

export class TeacherApiError extends Error {
  constructor(public messages: string[]) {
    super(messages.join(" "));
  }
}

export async function teacherFetch<T>(getToken: GetToken, url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { ...init.headers, "content-type": "application/json", Authorization: `Bearer ${await getToken()}` },
    });
  } catch {
    throw new TeacherApiError(["인터넷 연결을 확인하고 다시 시도해 주세요."]);
  }
  const data = await res.json().catch(() => null);
  if (res.ok) return data as T;
  if (res.status === 401 || res.status === 403) {
    throw new TeacherApiError(["교사 권한을 확인하지 못했습니다. 로그아웃 후 다시 로그인해 주세요."]);
  }
  throw new TeacherApiError(data?.errors ?? [data?.error ?? "요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요."]);
}

export const errorMessages = (e: unknown) =>
  e instanceof TeacherApiError ? e.messages : ["요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요."];
