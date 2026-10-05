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

## 플랫폼 연동 (CRM · LMS)

`.env.example`을 `.env`로 복사해 값을 채웁니다.

| 변수 | 용도 |
| --- | --- |
| `VITE_CRM_ENDPOINT` | 상담·파트너 신청을 받을 CRM API (POST JSON). 비우면 데모 모드(브라우저 저장) |
| `VITE_CRM_PUBLIC_KEY` | 선택. `X-Api-Key` 헤더로 전송 |
| `VITE_LMS_URL`, `VITE_LEVEL_TEST_URL` | 학생 LMS, 레벨테스트 |
| `VITE_PARTNER_PORTAL_URL` | 유학원 파트너 포털 |
| `VITE_STAFF_CRM_URL` | 직원 CRM |
| `VITE_INSTITUTION_PORTAL_URL` | 대학·기업 포털 |
| `VITE_CONTACT_EMAIL`, `VITE_KAKAO_CHANNEL_URL` | 연락처 |

### 유입 추적 (학생 추천 · 직원 영업 · B2B 유학원)

사이트 접속 URL의 아래 파라미터를 30일간 저장해 상담 신청 시 CRM에 함께 보냅니다.

- `ref` 학생·학부모 추천인 코드, `staff` 직원 코드, `partner` 유학원·해외 파트너 코드
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`

예: `https://<도메인>/?partner=VN-HANOI&utm_source=zalo&lang=vi#/consult/form`

### CRM으로 전송되는 데이터 예시

```json
{
  "type": "student",
  "name": "Nguyen Van A",
  "country": "베트남",
  "phone": "+84 ...",
  "contactPref": "Zalo",
  "interest": "입국 전 한국어 80시간",
  "finder": "80h",
  "code": "ST-KIM01",
  "consent": "2026-10-05T05:17:01.857Z",
  "preferredLanguage": "Tiếng Việt",
  "attribution": { "staff": "ST-KIM01", "utm_source": "zalo" },
  "source": "website",
  "page": "https://.../#/consult/form",
  "siteLanguage": "vi",
  "submittedAt": "2026-10-05T05:17:01.857Z"
}
```

CRM 서버는 CORS에서 사이트 도메인을 허용해야 합니다.

## 기술 스택

React 19 · Vite · Tailwind CSS 4 · qrcode

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
npm run lint
```

## 운영 전 확인할 것

- 48·80·200시간 과정 구성, 추천 혜택, 소식 문구는 예시입니다. `src/content/*.js`에서 실제 운영 정책에 맞게 수정하세요.
- 개인정보처리방침 페이지를 마련하고 링크를 추가하세요.
- 비자 관련 안내는 하이코리아 최신 기준으로 주기적으로 확인하세요.
