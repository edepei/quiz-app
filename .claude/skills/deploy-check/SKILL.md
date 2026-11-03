---
name: deploy-check
description: 문제풀이 앱의 배포 전 점검과 보안 점검. 비밀키 노출, 교사 권한 확인, Firestore 규칙, 학생 제출·결과, PDF·Azure 출제, 결과표·평균, Vercel·Firebase 배포 설정을 읽기만 해서 점검하고, 결과와 고치는 방법을 알려 줍니다. 사용자가 /deploy-check로 직접 부를 때만 씁니다.
disable-model-invocation: true
---

# /deploy-check: 배포·보안 점검

이 앱(Next.js + Firebase + Azure AI, Vercel 배포)을 배포하기 전에 점검하고, **결과와 고치는 방법만 알려 줍니다.**
기준 문서는 `CLAUDE.md`와 `PRD.md`, 기준 코드는 지금 작업 폴더의 파일입니다. 문서와 코드가 다르면 다르다는 것 자체를 결과에 적습니다.

## 반드시 지킬 것 (점검 중 금지)

- 파일 수정·생성·삭제, 패키지 설치, 설정 변경, Firestore 데이터 변경, 커밋, GitHub 업로드(push), 배포를 하지 않습니다. 문제를 발견해도 고치지 말고 고치는 방법만 알려 줍니다.
- 파일을 만들거나 바꿀 수 있는 실행·빌드 명령은 자동으로 실행하지 않습니다. 예: `npm run build`, `npm run dev`, `npm install`, `npx vitest`, `vercel deploy`, `firebase deploy`, `git commit`/`push`/`fetch`/`pull`.
  - `npm test`나 `npm run build`로 확인할 필요가 있으면 사용자에게 직접 실행하도록 명령만 알려 줍니다.
- 읽기만 하는 명령은 써도 됩니다. 예: 파일 읽기·검색, `git status`, `git log`, `git grep`, `git check-ignore`, Firebase 도구의 조회 기능(규칙 보기, 문서 읽기), `vercel env ls`처럼 목록만 보는 명령.
- **실제 비밀키·로그인 정보·서비스 계정 키 내용은 화면에 출력하지 않습니다.** 결과에는 파일 이름, 줄 번호, 설정 이름, 발견 개수만 적습니다.
  - 서비스 계정 키 파일(`GOOGLE_APPLICATION_CREDENTIALS`가 가리키는 파일)은 열지 않습니다. 존재 여부와 위치(프로젝트 폴더 안인지 밖인지)만 봅니다.
  - `.env.local` 값은 화면에 출력하지 않습니다. 이름 목록만 보거나, 아래처럼 셸 변수에 담아 개수만 셉니다.
- 실제 화면·요청·클라우드 설정(Vercel 환경변수, Firebase 허용 도메인, 배포된 규칙 등)을 확인하지 못했으면, 코드만 보고 "안전하다"고 단정하지 말고 "확인하지 못한 항목"에 넣습니다.

## 점검 항목

### 1. 비밀키가 서버 설정에만 있는지

비밀값: `AZURE_API_KEY`(Azure), `FIREBASE_SERVICE_ACCOUNT_KEY`(배포용 Firebase 관리 키 내용), `GOOGLE_APPLICATION_CREDENTIALS`(내 컴퓨터용 키 파일 위치). `NEXT_PUBLIC_*`는 공개돼도 되는 웹 앱 설정값입니다.

- 비밀값 이름 앞에 `NEXT_PUBLIC_`이 붙어 있지 않은지(`.env.local` 이름 목록, 코드 검색).
- 비밀값을 읽는 코드가 서버 전용 파일에만 있는지: `src/lib/ai/azure.ts`, `src/lib/firebase/admin.ts`. `"use client"` 파일이나 `src/components/`에서 import하지 않는지.
- 서버 응답과 오류 문구에 키, 주소, 배포명, Azure 오류 원문을 넣지 않는지(`src/app/api/**/route.ts`, `aiFailureMessage`, `console.error` 내용).
- `.gitignore`가 `.env*`를 제외하는지, `git check-ignore -v .env.local`.
- 서비스 계정 키 파일이 프로젝트 폴더 밖에 있는지(경로 문자열만 비교, 내용 열지 않기).

### 2. 실제 파일과 Git 기록에 비밀키가 들어갔는지

값을 출력하지 않고 개수만 셉니다. 예(Git Bash):

```bash
KEY=$(grep '^AZURE_API_KEY=' .env.local | cut -d= -f2-); [ -n "$KEY" ] && echo "작업 파일: $(git grep -lF "$KEY" | wc -l)개, Git 기록: $(git log --all -p | grep -cF "$KEY")곳, 빌드 결과(.next/static): $(grep -rlF "$KEY" .next/static 2>/dev/null | wc -l)개"; unset KEY
```

- 위 결과가 모두 0인지. `.next/static`이 없으면 그 부분은 "확인하지 못함".
- 키 모양 검색(파일 이름과 개수만): `git grep -nE "BEGIN PRIVATE KEY|\"private_key\"|AZURE_API_KEY=|api-key\"\s*:\s*\"[A-Za-z0-9]{20,}"`, 같은 패턴을 `git log --all -p`에도 적용합니다.
- 확인 범위를 결과에 적습니다: 이 컴퓨터의 작업 파일, 이 컴퓨터의 Git 기록, 빌드 결과. GitHub 원격 저장소의 다른 브랜치나 포크, Vercel 빌드 기록은 이 방법으로 보이지 않으므로 "확인하지 못한 항목"입니다.
- 발견하면: 그 키를 교체·폐기해야 한다고 안내합니다. 글에서 지우는 것만으로는 부족합니다. Azure 키는 강사에게, Firebase 키는 Firebase 콘솔 → 프로젝트 설정 → 서비스 계정에서 교체합니다.

### 3. 교사 기능의 서버 권한 확인

- 교사 창구가 모두 맨 처음 `requireTeacher`(`src/lib/teacher/guard.ts`)를 부르는지:
  - `teacher/me`, `teacher/papers`(GET·POST: JSON 업로드와 AI 생성본 저장), `teacher/papers/[id]`(PATCH 공개·숨김), `teacher/papers/[id]/results`(결과표), `teacher/generate`(PDF·AI 출제)
  - 삭제 창구가 있다면 그것도 포함합니다.
  - `src/app/api/teacher/` 아래 모든 `route.ts`를 찾아 빠진 것이 없는지 봅니다.
- `verifyTeacherToken`(`src/lib/teacher/verify.ts`)이 Firebase ID 토큰의 서명·발급자·대상(프로젝트 ID)을 확인하고, `email_verified`와 `TEACHER_EMAIL` 1개 일치를 확인하는지.
- 401(로그인 없음·가짜)과 403(다른 계정)을 돌려주는지, 화면 버튼 숨김에만 기대지 않는지.

### 4. 학생과 다른 계정의 접근

- 학생 쪽 창구(`student/submit`, `src/app/student/page.tsx`)가 정답·해설을 제출 전에 보내지 않는지(`toStudentPaper`).
- 학생이 다른 학생의 결과나 전체 결과를 읽는 창구가 없는지(`src/app/api/` 전체 확인).
- 다른 Google 계정이 교사 창구를 부르면 거절되는지(코드와 자동 점검 `guard.test.ts`, `results.test.ts`). 실제 다른 계정으로 확인하지 않았다면 "확인하지 못한 항목".

### 5. Firestore 직접 접근 규칙과 서버 권한을 각각 확인

- 저장소의 `firestore.rules`가 브라우저 직접 읽기·쓰기를 모두 거부하는지.
- 실제로 배포된 규칙이 같은지: Firebase 도구의 규칙 조회(읽기 전용)로 비교합니다. 조회할 수 없으면 "확인하지 못한 항목"에 넣고, Firebase 콘솔 → Firestore → 규칙 탭에서 보는 방법을 안내합니다.
- 서버는 관리 키로 규칙을 우회하므로, 규칙과 별개로 3번의 서버 권한 확인이 꼭 필요하다는 점을 함께 적습니다.

### 6. 마지막 제출·채점·저장·재응시

- 채점이 서버에서만 일어나는지(`student/submit` → `buildResult`). 채점할 때 AI를 부르지 않는지.
- 저장에 성공한 뒤에만 결과를 돌려주는지, 실패하면 답을 유지하고 다시 제출하게 하는지(`QuizApp.tsx`).
- 재응시 규칙이 문서와 같은지:
  - 지금 문서 기준: 같은 문제지·같은 이름은 결과 문서가 하나(`resultDocId`)이고, 다시 풀면 최신 결과로 덮어씁니다. 재응시 제한은 없습니다.
  - 사용자가 "재응시 제한"이나 "중복 요청이 기존 결과를 바꾸지 않음"을 요구한다면, 지금 구현은 그와 다르므로 "문제가 발견된 항목"에 근거와 함께 적습니다.
- 같은 제출을 두 번 보내면 같은 문서를 덮어써 결과가 두 개 생기지 않는지.

### 7. 문제지 삭제·숨김과 같은 제목

- 삭제 기능이 있는지, 있다면 연결된 결과(`results`의 같은 `paperId`)도 지우는지.
  - 지금 문서 기준으로 삭제 기능은 없고, 숨김("비공개로 바꾸기")만 있습니다.
  - 요구사항이 "삭제 시 결과도 제거"라면 구현되지 않은 것으로 적습니다.
- 숨김: 학생 목록에서 빠지는지(`listPublishedPapers`), 숨긴 문제지는 제출·채점이 안 되는지(`getPublishedPaper`), 교사 결과표·평균에서 빠지는지(409). 저장된 결과는 지우지 않는다는 점도 적습니다.
- 같은 제목 저장 금지: `createPaper`가 거래(transaction) 안에서 `titleKey`(공백·대소문자 무시)와 내용 중복을 확인하는지. JSON 업로드와 AI 생성본 저장 모두 적용되는지.

### 8. PDF 처리·Azure 출제·저장/취소/즉시 공개

- 입력 기준(`src/lib/pdf/limits.ts`): 파일 524,288바이트 이하, 본문 300~12,000자.
  - 넘으면 AI 호출 전에 거절하고, 본문을 자르지 않는지.
  - 빈 파일, PDF가 아닌 파일, 암호·손상·스캔 PDF를 거절하는지(`extract.ts`).
- Azure 호출(`src/lib/ai/azure.ts`):
  - `AZURE_API_STYLE=openai-v1`일 때만 부르는지, 다른 방식으로 추측하지 않는지.
  - 시간 제한이 있는지, 자동 재시도가 없는지.
  - 401·403·429·시간 초과·형식 오류 안내가 구분되는지.
  - Azure 오류가 교사 로그인 오류(401/403)와 섞이지 않는지(429/502/503/504).
- PDF 안 명령을 따르지 않게 하는 지시문, 기존 제목 전달이 있는지.
- 결과 검사: 생성 직후와 저장 때 모두 `validateGeneratedText`(10문항, 보기 4개, 정답 1~4, 해설, 제목 100자)를 쓰는지.
- 화면(`PdfGenerate.tsx`):
  - 버튼이 "저장하고 공개하기"·"취소"뿐인지, 수정·재생성 버튼이 없는지.
  - 생성 중 중복 실행이 막히는지.
  - 같은 제목이면 저장 버튼이 막히는지, 취소하면 저장되지 않는지.
- 저장하면 `published: true`로 바로 공개되는지, JSON 업로드는 비공개로 저장되는지.
- 실제 Azure 호출은 이 점검에서 하지 않습니다. 이용량과 비용이 들기 때문입니다. 마지막 실제 확인 기록은 PRD.md 5.2절 4단계 "확인 상태"에서 읽어 옵니다.

### 9. 교사 결과표와 문제지별 평균

- 결과를 제목이 아니라 `paperId`로 찾는지(`getPaperResults`).
- 평균 = 결과 점수 합 ÷ 결과 수(`averageScore`)인지, 결과가 없으면 0점이 아니라 "아직 제출한 학생이 없습니다"인지.
- 결과 문서는 최종 제출 저장 때만 생기는지(풀이 중·저장 실패는 기록 없음).
- 같은 이름이 한 번만 반영되는지.
- 표가 학생 이름 / 점수 / 틀린 문항(번호와 문제 내용, 없으면 "없음") 3칸인지.
- 실제 데이터 점검(선택, 읽기 전용): Firestore `results`에서 연결된 문제지가 없는 결과, 같은 `paperId`+이름 중복이 있는지 개수만 셉니다. 고치거나 지우지 않습니다.

### 10. Vercel 배포 설정과 Firebase 허용 도메인

- 서버가 배포 환경에서 `FIREBASE_SERVICE_ACCOUNT_KEY`(키 내용)를 읽을 수 있는지(`src/lib/firebase/admin.ts`). 내 컴퓨터의 키 파일 경로(`GOOGLE_APPLICATION_CREDENTIALS`)에만 의존하지 않는지.
- Vercel Production에 필요한 설정 이름이 모두 있는지(값은 보지 않음):
  - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `TEACHER_EMAIL`, `FIREBASE_SERVICE_ACCOUNT_KEY`
  - `AZURE_API_STYLE`, `AZURE_ENDPOINT`, `AZURE_DEPLOYMENT`, `AZURE_API_KEY`
  - `vercel env ls`로 이름만 확인합니다. CLI가 없거나 로그인돼 있지 않으면 "확인하지 못한 항목"에 넣고, 설정 화면 https://vercel.com/sohyunpei-4935s-projects/quiz-app/settings/environment-variables 에서 이름을 보는 방법을 안내합니다.
  - `NEXT_PUBLIC_*`는 바꾸면 다시 배포해야 반영된다는 점도 적습니다.
- 함수 실행 시간: `teacher/generate`의 `maxDuration`이 AI 시간 제한(2분)보다 긴지.
- 요청 크기: PDF 512KiB와 함께 가는 정보가 Vercel 요청 한도(4.5MB) 안인지.
- Firebase Authentication 허용 도메인에 `localhost`, `quiz-app-ruddy-delta-94.vercel.app`이 있는지. 도구로 볼 수 없으면 Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에서 확인하는 방법을 안내합니다.
- 배포 주소에서 실제로 시험했는지는 PRD.md의 확인 상태에서 읽어 옵니다. 시험하지 않았으면 "확인하지 못한 항목".

## 결과 알려 주는 방법

사용자는 개발을 모르는 일반인입니다. 쉬운 한국어로, 아래 세 묶음으로 나눠 알려 줍니다.

1. **확인한 항목**: 무엇을 어떻게 확인했는지(코드를 읽음 / 명령으로 개수를 셈 / 클라우드 설정을 조회함)를 함께 적습니다.
2. **문제가 발견된 항목**: 항목마다 다음을 적습니다.
   - 위치(파일 이름·줄 번호 또는 설정 이름)
   - 근거: 왜 문제인지
   - 고치는 방법: 사용자가 할 일은 어느 화면에서 무엇을 누르는지까지 적습니다.
   - 실제 키 값과 로그인 정보는 적지 않습니다.
   - 요구사항과 구현이 다른 것(예: 재응시 제한, 삭제 시 결과 제거)도 여기에 적습니다.
3. **확인하지 못한 항목**: 이유(도구 없음, 로그인 필요, 실제 요청·화면을 보지 않음 등)와 사용자가 직접 확인하는 방법을 적습니다.

마지막에 "이번 점검에서는 아무것도 고치거나 배포하지 않았습니다"라고 적습니다.
