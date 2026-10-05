// 웹사이트에서 들어온 신청 데이터를 검증·정리합니다.
const TYPES = ['student', 'partner', 'university', 'company']
const TEXT_FIELDS = {
  name: 80,
  org: 120,
  country: 60,
  phone: 80,
  email: 120,
  contactPref: 40,
  interest: 120,
  message: 2000,
  code: 40,
  finder: 10,
  preferredLanguage: 40,
  siteLanguage: 8,
  page: 500,
}
const ATTRIBUTION_KEYS = ['ref', 'staff', 'partner', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content']

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function sanitizeLead(body) {
  if (!body || typeof body !== 'object') return { error: 'invalid body' }
  const lead = { type: TYPES.includes(body.type) ? body.type : 'student' }
  for (const [key, max] of Object.entries(TEXT_FIELDS)) lead[key] = str(body[key], max)

  const attribution = {}
  for (const key of ATTRIBUTION_KEYS) {
    const v = str(body.attribution?.[key], 64)
    if (v) attribution[key] = v
  }
  lead.attribution = attribution
  // 신청서에 직접 입력한 코드는 유입 코드가 없을 때만 보조로 사용합니다.
  lead.code = lead.code.toUpperCase()

  lead.consentAt = str(body.consent, 40)
  if (!lead.name) return { error: 'name required' }
  if (!lead.phone && !lead.email) return { error: 'contact required' }
  if (!lead.consentAt) return { error: 'consent required' }
  return { lead }
}

// 추천인·직원·파트너 코드: 링크로 들어온 코드가 우선, 없으면 직접 입력한 코드
export function sourceOf(lead) {
  const a = lead.attribution || {}
  if (a.staff) return { kind: 'staff', code: a.staff.toUpperCase() }
  if (a.partner) return { kind: 'partner', code: a.partner.toUpperCase() }
  if (a.ref) return { kind: 'ref', code: a.ref.toUpperCase() }
  if (lead.code) return { kind: 'manual', code: lead.code }
  return { kind: 'direct', code: '' }
}

export function buildStats(leads) {
  const count = (fn) => {
    const m = {}
    for (const l of leads) {
      const k = fn(l)
      if (k) m[k] = (m[k] || 0) + 1
    }
    return m
  }
  // 코드별 성과: 유입 건수와 등록 확정 건수
  const byCode = (kind) => {
    const m = {}
    for (const l of leads) {
      const s = sourceOf(l)
      if (s.kind !== kind) continue
      m[s.code] ||= { code: s.code, leads: 0, enrolled: 0 }
      m[s.code].leads++
      if (l.status === 'enrolled') m[s.code].enrolled++
    }
    return Object.values(m).sort((a, b) => b.leads - a.leads)
  }
  return {
    total: leads.length,
    byStatus: count((l) => l.status),
    byType: count((l) => l.type),
    byCountry: count((l) => l.country || '-'),
    byChannel: count((l) => l.attribution?.utm_source || 'direct'),
    staff: byCode('staff'),
    partners: byCode('partner'),
    referrers: byCode('ref'),
    manual: byCode('manual'),
  }
}

const CSV_COLUMNS = ['createdAt', 'status', 'assignee', 'type', 'name', 'org', 'country', 'phone', 'email', 'contactPref', 'interest', 'finder', 'preferredLanguage', 'sourceKind', 'sourceCode', 'utm_source', 'utm_campaign', 'message']

function csvCell(v) {
  let s = String(v ?? '')
  // 스프레드시트 수식 주입 방지 (전화번호 형식 +84 ... 는 그대로 둠)
  if (/^[=+\-@\t\r]/.test(s) && !/^\+[\d\s()-]+$/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export function toCsv(leads) {
  const rows = leads.map((l) => {
    const s = sourceOf(l)
    const row = { ...l, sourceKind: s.kind, sourceCode: s.code, utm_source: l.attribution?.utm_source, utm_campaign: l.attribution?.utm_campaign }
    return CSV_COLUMNS.map((c) => csvCell(row[c])).join(',')
  })
  // 엑셀 한글 깨짐 방지를 위한 BOM
  return '﻿' + [CSV_COLUMNS.join(','), ...rows].join('\r\n')
}
