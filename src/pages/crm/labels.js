// 내장 CRM 화면 공용 상수
export const ROLE_LABEL = { admin: '관리자', staff: '직원', partner: '유학원' }
export const STATUS_LABEL = { new: '신규', contacted: '상담 중', 'level-test': '레벨테스트', enrolled: '등록 확정', lost: '종료' }
export const STATUS_STYLE = {
  new: 'bg-brand-50 text-brand-700',
  contacted: 'bg-amber-50 text-amber-700',
  'level-test': 'bg-sky-50 text-sky-700',
  enrolled: 'bg-lime-soft text-ink',
  lost: 'bg-slate-100 text-slate-500',
}
export const TYPE_LABEL = { student: '학생·학부모', partner: '유학원·파트너', university: '대학·교육기관', company: '기업' }
export const SOURCE_LABEL = { staff: '직원', partner: '유학원', ref: '추천인', manual: '직접 입력 코드', direct: '직접 방문' }
export const ACTION_LABEL = {
  'auth.login': '로그인',
  'auth.login_failed': '로그인 실패',
  'auth.login_blocked': '로그인 차단',
  'auth.logout': '로그아웃',
  'auth.password_changed': '비밀번호 변경',
  'lead.list': '목록 조회',
  'lead.view': '상세 열람',
  'lead.update': '정보 수정',
  'lead.create': '학생 등록',
  'lead.export': 'CSV 내보내기',
  'lead.forward': '외부 CRM 재전송',
  'lead.denied': '권한 없는 열람 시도',
  'lead.auto_assign': '자동 배정',
  'user.create': '계정 생성',
  'user.update': '계정 수정',
}

export const fmt = (iso) => (iso ? new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-')

export const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500'
export const btnPrimary = 'rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50'
export const btnGhost = 'rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:border-ink disabled:opacity-50'
