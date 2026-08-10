# GlCnB (Global C&B)

해외 유학생의 전 과정을 관리하는 여정(Journey) 관리 플랫폼입니다.
출국 전 준비부터 어학연수, 학부진학, 취업·정주까지 유학의 전 단계를
하나의 서비스에서 체계적으로 지원하는 것을 목표로 합니다.

## 서비스 소개

유학 준비는 국가·학교·비자 유형에 따라 필요한 절차와 일정이 제각각이라,
학생과 가족이 여러 정보를 따로 찾아 관리해야 하는 어려움이 있습니다.
GlCnB는 이 과정을 아래 4단계 여정으로 구조화하여, 각 단계에 필요한
체크리스트·일정·전문 코디네이터 매칭을 한 곳에서 제공합니다.

1. **출국 전 준비** — 비자·서류, 학교/기숙사 매칭, 출국 전 오리엔테이션
2. **D-4 어학연수** — 어학원 등록, 현지 생활 정착, 학업 진도 관리
3. **D-2 학부진학** — 대학 지원 전략, 입학 서류 관리, 학기별 학점 코칭
4. **취업·정주** — 인턴십·취업 연계, 취업 비자 전환, 현지 정주 네트워크

## 기술 스택

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) 4

## 시작하기

```bash
npm install
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속해
랜딩 페이지를 확인할 수 있습니다.

### 주요 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | Oxlint 실행 |

## 프로젝트 구조

```
src/
├── components/       # 랜딩 페이지 섹션 컴포넌트
│   ├── Navbar.jsx
│   ├── Hero.jsx
│   ├── JourneySection.jsx   # 4단계 여정 카드
│   ├── HowItWorks.jsx
│   ├── ContactCta.jsx
│   └── Footer.jsx
├── data/
│   └── journey.js    # 4단계 여정 데이터
├── App.jsx
└── main.jsx
```