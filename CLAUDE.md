# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 현황

- 문제풀이 교육용 웹앱입니다. 요구사항의 기준 문서는 [PRD.md](PRD.md)입니다.
- 1일차 앱이 만들어져 있고, 2일차 1단계로 **교사·학생 화면을 나눴습니다**(2026-11-03, PRD.md 5.2절). 첫 화면(`/`)에서 역할을 고르고, 학생(`/student`)은 이름 입력 → 공개된 문제지 목록 → 문항 확인 → 풀이 → 결과, 교사(`/teacher`)는 **Firebase Google 로그인**(허용 계정 1개) 뒤 문제지 등록·공개·결과 조회를 합니다. 3단계로 **Firestore 저장**을 붙였습니다(PRD.md 5.2절 3단계). 4단계로 **PDF 학습자료 → Azure AI 문제 생성**을 붙였습니다(PRD.md 5.2절 4단계, 2026-11-03). 학생이 파일을 올리던 초기 버전은 더 이상 쓰지 않습니다(PRD.md 7절 버전 기록).
- Git 저장소(`main`)는 GitHub 원격 저장소 `origin`(https://github.com/edepei/quiz-app)과 연결돼 있습니다.
- Vercel 프로젝트 `quiz-app`(계정 `sohyunpei-4935`, 무료 요금제)에 연결돼 있고(`.vercel/`, Git 제외), 정식 주소는 https://quiz-app-ruddy-delta-94.vercel.app 입니다(2026-11-03 첫 배포). Vercel 프로젝트는 GitHub 저장소(`edepei/quiz-app`, 운영 브랜치 `main`)와 연결돼 있지만, `vercel.json`의 `"git": {"deploymentEnabled": false}`로 **push해도 자동 배포하지 않게** 했습니다(2026-11-03 추가, 이 설정이 든 커밋을 push한 뒤부터 적용). GitHub는 코드 보관용이고, 배포는 요청 시 `vercel deploy --prod --yes`로만 합니다.
- **배포와 GitHub push는 사용자가 따로 요청할 때만 합니다.** 둘 다 전에 `npm test`와 `npm run build`를 확인합니다. `vercel.json`이 든 커밋이 GitHub에 올라가기 전에는 push가 곧 자동 배포이니 주의합니다. 그 전에는 `vercel` 등 배포 도구를 실행하거나 임시·공개 주소를 만들지 않습니다.
- 학생이 푸는 문제지는 교사가 올려 Firestore에 저장·공개한 것입니다. `question-papers/` 폴더의 JSON 파일(`high-school-questions.json` "고등학교 정보과목", `sample-questions.json` "중학교 정보과목", 각 10문항)은 교사 업로드용 예시이며 학생 목록에 바로 나오지 않습니다. 사용자가 요청하지 않는 한 문제지나 문항을 새로 만들거나 내용을 고치지 않습니다.
- Firebase 프로젝트 `quiz-app-5e205`(표시 이름 quiz-app, 무료 요금제, 웹 앱 `quiz-app-web`). Authentication의 Google 로그인 사용 설정됨. 로그인 허용 도메인: localhost, `quiz-app-5e205.firebaseapp.com`, `quiz-app-5e205.web.app`, `quiz-app-ruddy-delta-94.vercel.app`(2026-11-03 추가, 같은 날 공개 설정 조회로 다시 확인). 콘솔에 같은 이름 "quiz-app"의 다른 프로젝트 `quiz-app-ec52e`가 있지만 이 앱은 쓰지 않습니다. Firebase MCP 도구의 현재 프로젝트도 이것으로 맞춰 둠.
- Firestore: 기본 데이터베이스, 보안 규칙 `firestore.rules`는 브라우저 직접 접근을 모두 거부(서버만 사용). 규칙 배포: `firebase deploy --only firestore:rules`(`firebase.json`, `.firebaserc`).
- 설정값은 `.env.local`(Git 제외)에만 있습니다: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`(웹 앱 공개 설정값), `TEACHER_EMAIL`(허용 교사 이메일), `GOOGLE_APPLICATION_CREDENTIALS`(서버용 서비스 계정 키 파일 위치, 키 파일은 프로젝트 폴더 밖에 둠). 배포 서비스에서는 키 파일 대신 `FIREBASE_SERVICE_ACCOUNT_KEY`(키 내용)를 사용자가 직접 입력합니다. **키 파일 내용은 열어 보거나 답변·코드·저장소에 넣지 않습니다.** 바꾸면 개발 서버를 다시 켜야 반영됩니다. Vercel Production 환경변수에는 `NEXT_PUBLIC_FIREBASE_*` 4개, `TEACHER_EMAIL`, `FIREBASE_SERVICE_ACCOUNT_KEY`(사용자가 Vercel 화면에서 직접 입력, 숨김 값)가 있고, **Azure 4개는 아직 없습니다**(2026-11-03 `vercel env ls`로 이름만 확인). Vercel에는 `GOOGLE_APPLICATION_CREDENTIALS`(내 컴퓨터 파일 경로)를 넣지 않습니다. 서버(`src/lib/firebase/admin.ts`)는 `FIREBASE_SERVICE_ACCOUNT_KEY`가 있으면 그것을 쓰고, 키 내용이 JSON이 아니거나 `NEXT_PUBLIC_FIREBASE_PROJECT_ID`와 다른 프로젝트 키면 연결하지 않고 서버 기록에 이유만 남깁니다. Vercel에서는 파일 경로 방식으로 연결하지 않습니다. 설정 화면: https://vercel.com/sohyunpei-4935s-projects/quiz-app/settings/environment-variables (계정 경로가 `sohyunpei-4935s-projects`). 비밀값을 CLI로 Vercel에 보내는 것은 자동 모드에서 막히므로 사용자가 직접 넣습니다. `NEXT_PUBLIC_*`는 빌드할 때 들어가므로 Vercel에서 바꾸면 다시 배포해야 반영됩니다.
- Azure AI(강사 제공): 호출 방식 `openai-v1`(주소 `{AZURE_ENDPOINT}/openai/v1/chat/completions`, 머리말 `api-key`, `model`=배포명, JSON 모양 강제). 설정값은 `.env.local`의 `AZURE_API_STYLE`, `AZURE_ENDPOINT`, `AZURE_DEPLOYMENT`, `AZURE_API_KEY`(비밀값, 답변·코드·저장소에 넣지 않음). `AZURE_API_STYLE`이 `openai-v1`이 아니면 부르지 않습니다(다른 방식 추측 금지). **Vercel에는 아직 넣지 않았습니다**(배포할 때 사용자가 Vercel 화면에서 Production으로 직접 4개 입력, `AZURE_API_KEY`는 Secret). 실제 호출 시험은 강사가 허용한 범위에서 최소 횟수로만 합니다.
- 작업 폴더가 OneDrive 동기화 폴더(`바탕 화면`) 안에 있습니다. 설치 중 파일 잠김 오류(`EPERM`, `EBUSY`)가 나면 이 점부터 의심합니다.

## 명령 (2026-11-02 실제로 확인함)

- `npm run dev`: 내 컴퓨터에서 실행 → http://localhost:3000 (`.claude/launch.json`의 `quiz-app`으로도 실행 가능)
- `npm test`: 자동 점검(Vitest, `vitest.config.mts`). 한 파일만: `npx vitest run src/lib/quiz/quiz.test.ts`, 한 항목만: `npx vitest run -t "70점"`
- `npm run build`: 빌드와 타입 검사
- 다른 대화의 개발 서버가 3000번을 쓰고 있으면 새 개발 서버가 켜지지 않습니다. 그때는 빌드 후 `.claude/launch.json`의 `quiz-app-built`(http://localhost:3002, 빌드한 앱 실행)로 확인합니다. 코드를 바꾸면 다시 빌드하고 다시 켜야 반영됩니다.
- `vercel deploy --prod --yes`: 정식 주소로 배포(요청 시에만, 2026-11-03 확인). 정식 주소는 로그인 없이 열리지만, 배포마다 생기는 긴 주소는 Vercel 로그인을 요구합니다.

## 코드 구조

- `src/lib/quiz/`: 화면과 분리된 핵심 로직. `validate.ts`(문제지 글자 → 제목·문항 또는 쉬운 한국어 오류 목록, 교사 화면과 서버가 함께 씀), `grade.ts`(점수·정오 계산), `types.ts`(`StudentQuestion`/`StudentPaper`는 정답·해설을 뺀 풀이용 모양).
- `src/lib/firebase/`: `client.ts`(브라우저 로그인용), `admin.ts`(서버 전용 Firestore 연결, 키 설정이 없으면 null).
- `src/lib/store/`: `firestore.ts`(문제지·결과 읽기·쓰기, 중복 확인), `records.ts`(제출 검사·결과 모양·평균·틀린 문항 내용 붙이기(`wrongItems`) 등 순수 로직), `responses.ts`.
- `src/lib/pdf/`: `limits.ts`(교육용 입력 기준: 파일 512KiB=524,288바이트, 본문 300~12,000자, 공백 정리·글자 수, 화면과 서버가 함께 씀), `extract.ts`(서버 전용, `unpdf` 1.8.1로 본문 읽기, 암호·손상·글자 없음(스캔) 거절). 기준을 넘으면 AI를 부르지 않고 거절하며 본문을 자르지 않습니다. 이 기준은 플랫폼 공통 한도가 아닙니다.
- `src/lib/ai/`: `azure.ts`(서버 전용 Azure 호출·지시문·오류 구분, 자동 재시도 없음, 2분 시간 제한), `generated.ts`(AI 결과 형식 검사: 기존 `validatePaperText` + 정확히 10문항 + 제목 100자 이내).
- `src/lib/teacher/`: `verify.ts`(로그인 증명 확인), `guard.ts`(`requireTeacher`: 교사 서버 창구마다 맨 먼저 호출).
- 서버 창구 `src/app/api/`: `teacher/me`, `teacher/papers`(GET 목록, POST 등록: JSON 파일은 비공개, `source: "pdf-ai"`는 10문항 검사 후 바로 공개), `teacher/generate`(POST PDF → 본문 읽기 → Azure 생성 → 형식 검사 → 결과와 제목 중복 여부 반환, 저장·PDF 보관 안 함. Azure 오류는 429/502/503/504 + `reason`으로 돌려 교사 로그인 오류 401/403과 구분), `teacher/papers/[id]`(PATCH 공개 변경), `teacher/papers/[id]/results`(GET 결과표·평균: `paperId`로 조회, 숨긴 문제지는 409로 거절), `student/submit`(POST 최종 제출 → 채점·저장 → 결과 반환).
- `src/app/page.tsx`: 첫 화면. `src/app/teacher/page.tsx` → `src/components/teacher/`(`TeacherApp` 로그인, `TeacherDashboard`, `PdfGenerate`(PDF로 문제 만들기 → 확인 → "저장하고 공개하기"/"취소"만, 수정·재생성 버튼 없음), `PaperPreview`, `PaperUpload`, `PaperResults`(결과표: 학생 이름 / 점수 / 틀린 문항 번호와 문제 내용, 평균), `api.ts`).
- `src/app/student/page.tsx`: 요청마다 공개된 문제지를 정답 없이 읽어 `StudentApp`(`NameStep` → `QuizApp`)에 넘깁니다. 이름 정리는 `src/lib/student/name.ts`.
- `src/components/quiz/QuizApp.tsx`: 단계(`list` → `ready` → `solving` → `result`)와 답을 들고 있다가, 제출 때 한 번 `/api/student/submit`을 부릅니다. 실패하면 답을 유지하고 다시 제출하게 합니다.
- `src/components/quiz/`의 단계별 화면: `PaperListStep`, `ReadyStep`, `QuestionStep`, `ResultStep`.
- 스타일은 `src/app/globals.css` 하나에 직접 작성합니다(추가 디자인 도구 없음).

## 요구사항 요약 (자세한 내용은 PRD.md)

- 기술 구성: Next.js + TypeScript, Vercel 배포, PC·휴대폰 반응형 화면
- 흐름: 문제지 목록 → 문제지 선택 → 문항 확인 → 한 문제씩 풀이 → 모든 문항 완료 → 최종 채점 → 점수·문항별 정오·해설 확인
- 문제지 파일(교사 업로드 형식, 예시는 `question-papers/*.json`): 최상위에 `title`(목록에 표시, `questions` 앞에 작성)과 `questions` 배열. 문항마다 `question`, `options`(4개), `correctAnswer`(1~4, 1이 첫 번째 보기), `explanation`이 있습니다.
- 목록 제목은 각 문제지의 `title`에서 읽습니다. 학생에게 파일 업로드를 요구하지 않습니다.
- 풀이 중에는 정답 여부·점수·해설을 보여주지 않으며, 정답·해설을 학생 화면에 보내지도 않습니다(2일차 3단계부터, 채점은 서버).
- 점수: `정답 수 ÷ 전체 문항 수 × 100`, 소수 첫째 자리까지 반올림합니다.
- 세부 결정 사항(잘못된 문제지 처리, 이전/다음 이동, 결과 화면 구성 등)은 PRD.md 4.5절을 따릅니다.

### 지금 만들 기능과 나중에 추가할 기능

- **1일차 (지금 범위)**: `question-papers` 문제지 목록 표시·선택, 문항 표시, 4지선다 풀이, 완료 후 채점·점수·정오·해설 표시, 로컬 실행, Vercel 배포(요청 시)
- **1일차에 만들지 않는 것**: 로그인, AI 문제 생성, DB 저장 (2일차에 교사 로그인까지 진행함)
- **2일차 (나중 범위)**: 교사 Google 로그인과 학생 이름 기반 게스트 입장, 학습자료 업로드와 Azure AI 문제 생성, 생성 문제 저장·공개와 학생 문제 목록, 풀이 결과 Firestore 저장, 교사의 학생별 점수·오답·평균 조회
- 2일차 진행 상황(2026-11-03): 1단계 화면 나누기, 2단계 교사 로그인, 3단계 Firestore 저장, 4단계 PDF·Azure 문제 생성, 5단계 결과표 보강을 만들었습니다. 최종 배포는 아직 하지 않았습니다. 4단계는 내 컴퓨터에서 로그인 후 생성→저장(공개)→학생 풀이→결과 저장까지 확인했고, 배포 주소에서는 아직 확인하지 않았습니다(PRD.md 5.2절 4단계 "확인 상태"). 문제지 **삭제 기능은 없습니다**(숨김 = "비공개로 바꾸기").
- 교사 결과표·평균 규칙(5단계, 자세한 내용과 확인 상태는 PRD.md 5.2절 5단계):
  - 허용 교사만 봅니다. 서버가 요청마다 로그인과 허용 계정을 확인하며, 버튼 숨김으로 대신하지 않습니다.
  - 결과는 제목이 아니라 `paperId`로 찾고, 다른 문제지 결과를 섞지 않습니다.
  - 표는 학생 이름 / 점수 / 틀린 문항(번호와 문제 내용, 없으면 "없음") 3칸입니다.
  - 평균 = 최종 제출이 저장된 학생 점수 합 ÷ 제출 학생 수(소수 첫째 자리)입니다. 같은 이름은 최신 결과 1개만 반영합니다(다시 풀기는 막지 않고 덮어씀, 재응시 제한 없음).
  - 제출이 없으면 0점이 아니라 "아직 제출한 학생이 없습니다"를 보여 줍니다. 숨긴(비공개) 문제지는 결과·평균을 보여 주지 않지만 저장된 결과는 지우지 않습니다.
  - 실제 데이터에 중복·누락이 있으면 지워 맞추지 말고 사용자에게 알립니다. 그래프·엑셀·상세 분석은 만들지 않습니다.
- 1일차 코드는 2일차 기능을 붙이기 쉽게 구성하되, 2일차 기능을 미리 만들지 않습니다.

## 앱을 만드는 기준

- PRD.md에 적힌 요구사항을 기준으로 작업합니다.
- 지금 만들 기능과 나중에 추가할 기능을 구분합니다.
- 정해진 조건을 마음대로 바꾸거나, 요청하지 않은 기능을 추가하지 않습니다.
- 정해지지 않은 내용이나 선택이 필요한 사항은 먼저 질문합니다.
- 기존 파일 내용과 PRD.md가 서로 다르면 임의로 결정하지 말고 사용자에게 알립니다.

## 사용자에게 설명하는 방법

사용자는 개발을 모르는 일반인입니다.

- 새 세션을 시작하면 먼저 1일차 작업인지 2일차 작업인지 물어봅니다.
- 모든 설명은 쉬운 한국어로 합니다.
- 개발 지식이 있어야 이해할 수 있는 기술 용어를 쓰지 않습니다.
- 사용자가 알아야 할 것은 "무엇을 하면 되는지"와 "어떤 결과가 나오는지"입니다.
- 화면에 표시된 버튼 이름과 파일 이름은 그대로 쓰고, 설명은 쉬운 말로 합니다.
- 설치나 설정이 필요하면 다음 순서로 안내합니다.
  1. 어느 화면을 열어야 하는지
  2. 무엇을 누르거나 입력해야 하는지
  3. 제대로 됐는지 무엇을 보고 확인하는지
- 사용자가 입력할 내용은 그대로 복사해 쓸 수 있게 제공합니다.
- 여러 가지를 한꺼번에 시키지 말고 한 단계씩 순서대로 안내합니다.
- 오류가 나면 원인과 해결 방법을 쉬운 말로 설명합니다.

## 작업을 진행하는 방법

- 앱을 만들기 전에 무엇을 어떤 순서로 만들지 짧게 설명하고 사용자의 확인을 받습니다.
- 수정한 뒤에는 무엇이 바뀌었는지, 사용자가 어떻게 확인하면 되는지 알려줍니다.
- 실제로 확인한 결과와 아직 확인하지 못한 부분을 구분해서 말합니다.
- 실행하거나 확인하지 않은 일을 완료했다고 말하지 않습니다.
- 앱 화면의 안내 문구와 오류 메시지도 일반인이 이해할 수 있는 쉬운 말로 씁니다.
- 사용자가 직접 브라우저를 조작하지 않아도 되도록 명령줄 도구(CLI), MCP, 플러그인을 최대한 활용합니다. 그래도 사용자가 직접 해야 하는 일(예: 계정 로그인)은 위의 안내 순서대로 친절히 안내합니다.
- 사용자의 컴퓨터 화면(마우스·키보드)을 직접 조작하지 않습니다.
