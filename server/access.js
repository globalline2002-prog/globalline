import { sourceOf } from './leads.js'

// 역할별 열람 범위
// - admin: 전체
// - staff: 본인에게 배정된 신청만
// - partner: 본인 파트너 코드로 유입되었거나 본인이 직접 등록한 신청만 (읽기 전용)
export function canSee(user, lead) {
  if (user.role === 'admin') return true
  if (user.role === 'staff') return lead.assigneeId === user.id
  if (user.role === 'partner') {
    if (lead.createdBy === user.id) return true
    const s = sourceOf(lead)
    return s.kind === 'partner' && Boolean(user.code) && s.code === user.code
  }
  return false
}

export function canEdit(user, lead) {
  return user.role === 'admin' || (user.role === 'staff' && lead.assigneeId === user.id)
}

// 목록용 요약 (연락처·메시지 등 개인정보 제외 — 상세 조회 시에만 열람·기록)
export function summary(lead) {
  const s = sourceOf(lead)
  return {
    id: lead.id,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    status: lead.status,
    type: lead.type,
    name: lead.name,
    org: lead.org,
    country: lead.country,
    interest: lead.interest,
    assigneeId: lead.assigneeId || '',
    assignee: lead.assignee || '',
    sourceKind: s.kind,
    sourceCode: s.code,
  }
}

// 상세 보기: 유학원에는 내부 메모·담당자·전달 기록 등 내부 정보를 숨깁니다.
export function detailFor(user, lead) {
  if (user.role !== 'partner') {
    const { userAgent: _ua, ...rest } = lead
    return rest
  }
  const { notes: _n, forward: _f, userAgent: _ua, assigneeId: _ai, page: _p, ...rest } = lead
  return rest
}
