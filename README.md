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
cp .env.example .env      # ADMIN_TOKEN 을 반드시 설정
npm install
npm start                 # 사이트 빌드 + 서버 실행 → http://localhost:8787
```

개발 중에는 `npm run server`(API)와 `npm run dev`(화면)를 함께 실행합니다. `/api` 요청은 자동으로 서버로 전달됩니다.

| 기능 | 내용 |
| --- | --- |
| 상담·파트너 접수 | `POST /api/leads` — 입력값 검증, 스팸 방지(숨김 필드·IP당 10분 10건), `data/leads.json`에 저장 |
| 내부 CRM 화면 | `#/admin` (메뉴에 노출 안 됨, `ADMIN_TOKEN` 로그인) — 상태(신규·상담 중·레벨테스트·등록 확정·종료), 담당자, 상담 메모, 검색·필터 |
| 성과 집계 | 직원(staff)·유학원(partner)·추천인(ref) 코드별 유입·등록·전환율, 채널·신청 유형 통계 |
| 내보내기 | CSV 다운로드 (엑셀 한글 지원) |
| 플랫폼 연결 상태 | 어떤 외부 시스템이 연결/미연결인지 관리 화면에서 확인 |

> `data/` 폴더에는 개인정보가 저장되므로 커밋되지 않으며(.gitignore), 서버 백업 대상에 포함하세요.

### 외부 시스템이 없을 때의 동작

| 항목 | 미연결 시 |
| --- | --- |
| 학생 LMS · 레벨테스트 | '오픈 예정' 표시 → 상담 신청으로 연결 (상담사가 레벨테스트 안내) |
| 유학원 파트너 포털 | '오픈 예정' 표시 → 파트너 안내·신청으로 연결 |
| 대학·기업 포털 | '오픈 예정' 표시 → 협력 문의로 연결 |
| 직원 CRM | 내장 CRM 관리 화면(`#/admin`)으로 연결 |

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
```

## 운영 전 확인할 것

- 48·80·200시간 과정 구성, 추천 혜택, 소식 문구는 예시입니다. `src/content/*.js`에서 실제 운영 정책에 맞게 수정하세요.
- 개인정보처리방침 페이지를 마련하고 링크를 추가하세요.
- 비자 관련 안내는 하이코리아 최신 기준으로 주기적으로 확인하세요.
