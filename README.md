# Global C&B 홍보 사이트

입국 전 한국어교육부터 D-4 어학연수, D-2 학부·대학원 진학, 취업·창업·정착까지
유학생 여정을 소개하고, **CRM·LMS 플랫폼과 연결되는** Global C&B 공식 홍보 사이트입니다.

## 메뉴별 페이지 (해시 라우팅 `#/페이지/섹션`)

| 메뉴 | 경로 | 주요 내용 |
| --- | --- | --- |
| 홈 | `#/` | 히어로, 대상별 안내, 4단계 여정, 과정 요약, CRM×LMS 흐름, 추천·영업·B2B, 소식 |
| 나의 상담 · 파트너 | `#/consult` | 상담·파트너 신청서(CRM 전송), 역할별 플랫폼 로그인, 학생 추천 프로그램, 추천·홍보 링크/QR 생성기, 직원 홍보·영업 지원, B2B 유학원 파트너, 대학·기업 협력 |
| 회사소개 | `#/about` | 미션, CRM·LMS 통합 플랫폼, 핵심 가치 |
| 한국어교육 · 입국 전 | `#/pre-departure` | 48·80·200시간 과정, 비교표, 나에게 맞는 과정 찾기 |
| D-4 어학연수 / D-2 학부·대학원 / 취업·창업·정착 | `#/d4` `#/d2` `#/career` | 핵심 정보, 진행 절차, 지원 내용 |
| 소식 · 공유 | `#/news` | 공지(공유 버튼), FAQ |

## 다국어

한국어 · English · Tiếng Việt · 中文 · Oʻzbekcha · Монгол 전체 콘텐츠를 제공합니다.

- 콘텐츠: `src/content/{ko,en,vi,zh,uz,mn}.js` (한국어가 기준, 빠진 키는 한국어로 표시)
- 언어 결정 순서: URL `?lang=vi` → 사용자가 고른 언어(브라우저 저장) → 브라우저 언어 → 한국어
- 추천 링크 생성 시 현재 언어가 링크에 포함되어 받는 사람도 같은 언어로 봅니다.

## 내장 CRM 서버 (외부 CRM·LMS 연결 전까지 사용)

외부 CRM·LMS·포털이 준비되기 전에도 사이트가 실제로 동작하도록 내장 서버(`server/`)를 포함합니다.
별도 패키지 없이 Node.js(20.12 이상)만으로 실행됩니다.

```bash
cp .env.example .env      # INITIAL_ADMIN_PASSWORD 를 반드시 설정 (첫 관리자 계정)
npm install
npm start                 # 사이트 빌드 + 서버 실행 → http://localhost:8787
```

개발 중에는 `npm run server`(API)와 `npm run dev`(화면)를 함께 실행합니다. `/api` 요청은 자동으로 서버로 전달됩니다.

| 기능 | 내용 |
| --- | --- |
| 상담·파트너 접수 | `POST /api/leads` — 입력값 검증, 스팸 방지(숨김 필드·IP당 10분 10건), `data/leads.json`에 저장 |
| 내부 CRM 화면 | `#/admin` (메뉴에 노출 안 됨, 계정 로그인) — 상태(신규·상담 중·레벨테스트·등록 확정·종료), 담당자 배정, 상담 메모, 검색·필터 |
| 성과 집계 | 직원(staff)·유학원(partner)·추천인(ref) 코드별 유입·등록·전환율, 채널·신청 유형 통계 |
| 내보내기 | CSV 다운로드 (엑셀 한글 지원) |
| 플랫폼 연결 상태 | 어떤 외부 시스템이 연결/미연결인지 관리 화면에서 확인 |

### 계정과 역할별 권한

| 역할 | 볼 수 있는 학생 | 할 수 있는 일 |
| --- | --- | --- |
| 관리자 | 전체 | 담당 직원 배정, 상태·메모 수정, CSV, 계정 관리, 열람 기록 조회 |
| 직원 | 본인에게 배정된 학생만 | 상태·상담 메모 수정, CSV(본인 담당분) |
| 유학원 | 본인 파트너 코드로 유입되었거나 직접 등록한 학생만 | 진행 상황 조회(읽기 전용), 학생 직접 등록 — 내부 메모·담당자 ID는 보이지 않음 |

- **첫 관리자**: `.env`의 `INITIAL_ADMIN_USERNAME`·`INITIAL_ADMIN_PASSWORD`로 첫 실행 때 자동 생성되고, 첫 로그인 시 비밀번호를 바꾸게 합니다.
- **계정 발급**: 관리자가 ‘계정 관리’ 탭에서 직원·유학원 계정을 만들고 임시 비밀번호를 전달합니다. 유학원 계정에는 파트너 코드(예: `VN-HANOI`)가 필수입니다.
- **자동 배정**: 직원 계정에 홍보 코드(예: `ST-KIM01`)를 넣으면, 그 코드의 링크로 들어온 신청이 해당 직원에게 자동 배정됩니다.
- **보안**: 비밀번호는 scrypt 해시로 저장, 로그인 5회 실패 시 15분 차단, 8시간 미사용 시 자동 로그아웃. 계정을 중지하거나 역할·코드·비밀번호를 바꾸면 그 사용자는 즉시 로그아웃됩니다. 목록에는 연락처가 나오지 않고 상세를 열 때만 보입니다.
- **서버 명령**(서버를 멈춘 상태에서): `npm run user -- list`, `npm run user -- create <아이디> --name 이름 --role admin|staff|partner [--code 코드]`, `npm run user -- reset <아이디>`(관리자 비밀번호 분실 시), `npm run user -- disable <아이디>`

### 열람 기록

목록 조회, 상세 열람, 수정, CSV 내보내기, 학생 등록, 권한 없는 열람 시도, 로그인·로그인 실패, 계정 생성·변경이 `data/audit.log`에 사용자·역할·IP·시각과 함께 한 줄씩 추가됩니다. 화면이나 API로 수정·삭제할 수 없습니다. 관리자는 ‘열람 기록’ 탭(사용자·활동별 필터)과 각 학생 상세 화면 하단에서 확인합니다.

> 이전 버전의 `ADMIN_TOKEN` 방식은 없어졌습니다. 기존 신청의 담당자(자유 입력)는 이름만 남아 있으므로, 직원이 보려면 관리자가 다시 배정해야 합니다.

> `data/` 폴더에는 개인정보가 저장되므로 커밋되지 않으며(.gitignore), 서버 백업 대상에 포함하세요.

### 외부 시스템이 없을 때의 동작

| 항목 | 미연결 시 |
| --- | --- |
| 학생 LMS · 레벨테스트 | '오픈 예정' 표시 → 상담 신청으로 연결 (상담사가 레벨테스트 안내) |
| 대학·기업 포털 | '오픈 예정' 표시 → 협력 문의로 연결 |
| 직원 CRM · 유학원 포털 | 내장 CRM(`#/admin`)으로 연결 — 계정 역할에 따라 보이는 학생이 다름 |

## 나중에 외부 플랫폼 연결하기

코드 수정 없이 `.env` 값만 채운 뒤 다시 빌드·실행하면 됩니다.

| 연결 대상 | 설정 | 동작 |
| --- | --- | --- |
| 외부 CRM (권장) | `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_SECRET` | 신규 리드를 내장 CRM에 저장하면서 외부 CRM으로도 전달. 헤더 `X-GCNB-Signature` = 본문의 HMAC-SHA256. 실패 시 관리 화면에서 재전송 |
| 외부 CRM 직접 접수 | `VITE_CRM_ENDPOINT`, `VITE_CRM_PUBLIC_KEY` | 사이트가 외부 CRM API로 바로 전송 (내장 서버 우회) |
| 학생 LMS · 레벨테스트 | `VITE_LMS_URL`, `VITE_LEVEL_TEST_URL` | '오픈 예정'이 사라지고 실제 로그인으로 연결 |
| 유학원 파트너 포털 | `VITE_PARTNER_PORTAL_URL` | 〃 |
| 직원 CRM | `VITE_STAFF_CRM_URL` | 직원 로그인이 외부 CRM으로 연결 |
| 대학·기업 포털 | `VITE_INSTITUTION_PORTAL_URL` | 〃 |

웹훅으로 전달되는 형식: `{ "event": "lead.created", "lead": { id, createdAt, status, type, name, phone, email, country, interest, attribution: { staff, partner, ref, utm_* }, ... } }`

다른 저장소(DB)로 옮길 때는 `server/store.js`의 함수(list·get·create·update)만 교체하면 됩니다.

### 유입 추적 (학생 추천 · 직원 영업 · B2B 유학원)

사이트 접속 URL의 아래 파라미터를 30일간 저장해 상담 신청 시 함께 보냅니다.

- `ref` 학생·학부모 추천인 코드, `staff` 직원 코드, `partner` 유학원·해외 파트너 코드
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`

예: `https://<도메인>/?partner=VN-HANOI&utm_source=zalo&lang=vi#/consult/form`

## 기술 스택

React 19 · Vite · Tailwind CSS 4 · qrcode · Node.js 내장 서버(의존성 없음)

```bash
npm install
npm run dev      # 화면 개발 서버
npm run server   # 내장 CRM 서버 (API)
npm start        # 빌드 + 서버 실행 (운영)
npm run lint
npm run test:smoke  # 빌드 후 서버·API 스모크 테스트
```

PR과 `main` 푸시마다 GitHub Actions(`.github/workflows/ci.yml`)가 lint → build → 스모크 테스트를 자동 실행합니다.

## 운영 전 확인할 것

- 48·80·200시간 과정 구성, 추천 혜택, 소식 문구는 예시입니다. `src/content/*.js`에서 실제 운영 정책에 맞게 수정하세요.
- 개인정보처리방침 페이지를 마련하고 링크를 추가하세요.
- 비자 관련 안내는 하이코리아 최신 기준으로 주기적으로 확인하세요.
