import { platform } from '../config'

const ATTRIBUTION_KEY = 'gcnb_attribution'
const LEADS_KEY = 'gcnb_demo_leads'
const ATTRIBUTION_TTL_DAYS = 30

const ATTRIBUTION_PARAMS = [
  'ref', // 학생·학부모 추천인 코드
  'staff', // 직원 홍보 코드
  'partner', // B2B 유학원·해외 파트너 코드
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
]

function safeGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장소를 쓸 수 없는 환경(사파리 프라이빗 등)에서는 조용히 무시
  }
}

// 방문 URL의 추천/캠페인 파라미터를 30일간 보관합니다(first-touch 우선, 새 코드가 오면 갱신).
export function captureAttribution() {
  const params = new URLSearchParams(window.location.search)
  const found = {}
  for (const key of ATTRIBUTION_PARAMS) {
    const value = params.get(key)
    if (value) found[key] = value.slice(0, 64)
  }

  const stored = safeGet(ATTRIBUTION_KEY)
  const isFresh =
    stored && Date.now() - stored.capturedAt < ATTRIBUTION_TTL_DAYS * 864e5

  if (Object.keys(found).length > 0) {
    const next = {
      ...(isFresh ? stored.values : {}),
      ...found,
    }
    safeSet(ATTRIBUTION_KEY, {
      values: next,
      capturedAt: Date.now(),
      landing: window.location.pathname,
    })
    return next
  }
  return isFresh ? stored.values : {}
}

export function getAttribution() {
  const stored = safeGet(ATTRIBUTION_KEY)
  if (!stored) return {}
  if (Date.now() - stored.capturedAt > ATTRIBUTION_TTL_DAYS * 864e5) return {}
  return stored.values
}

// 상담·파트너 신청을 CRM 으로 전송합니다. 엔드포인트가 없으면 데모 모드로 브라우저에 저장합니다.
export async function submitLead(form) {
  const payload = {
    ...form,
    attribution: getAttribution(),
    source: 'website',
    page: window.location.href,
    siteLanguage: document.documentElement.lang,
    submittedAt: new Date().toISOString(),
  }

  if (!platform.crmEndpoint) {
    const leads = safeGet(LEADS_KEY) || []
    leads.push(payload)
    safeSet(LEADS_KEY, leads)
    return { ok: true, demo: true }
  }

  const res = await fetch(platform.crmEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(platform.crmPublicKey ? { 'X-Api-Key': platform.crmPublicKey } : {}),
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`CRM 응답 오류 (${res.status})`)
  return { ok: true, demo: false }
}

// 직원·파트너·추천인이 SNS/메신저에 공유할 추적 링크를 만듭니다.
export function buildTrackingLink({ role, code, channel, campaign, lang }) {
  const url = new URL(window.location.origin + window.location.pathname)
  if (lang && lang !== 'ko') url.searchParams.set('lang', lang)
  if (code) url.searchParams.set(role, code.trim())
  if (channel) {
    url.searchParams.set('utm_source', channel)
    url.searchParams.set('utm_medium', role === 'ref' ? 'referral' : role)
  }
  if (campaign) url.searchParams.set('utm_campaign', campaign.trim())
  url.hash = '/consult/form'
  return url.toString()
}
