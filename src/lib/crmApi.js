// 내장 CRM API 클라이언트 (계정 로그인 · 역할별 권한)
const TOKEN_KEY = 'gcnb_crm_token'
export const LOGOUT_EVENT = 'gcnb:crm-logout'

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // 무시
  }
}

async function call(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    // 세션 만료·계정 중지 → 로그인 화면으로
    if (res.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event(LOGOUT_EVENT))
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status })
  }
  return res.headers.get('content-type')?.includes('json') ? res.json() : res.text()
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export const api = {
  login: (username, password) => call('/auth/login', json('POST', { username, password })),
  me: () => call('/auth/me'),
  logout: () => call('/auth/logout', { method: 'POST' }),
  changePassword: (current, next) => call('/auth/password', json('POST', { current, next })),

  leads: () => call('/crm/leads'),
  lead: (id) => call(`/crm/leads/${id}`),
  updateLead: (id, patch) => call(`/crm/leads/${id}`, json('PATCH', patch)),
  registerLead: (data) => call('/crm/leads', json('POST', data)),
  forward: (id) => call(`/crm/leads/${id}/forward`, { method: 'POST' }),
  leadAudit: (id) => call(`/crm/leads/${id}/audit`),
  stats: () => call('/crm/stats'),
  async downloadCsv() {
    const text = await call('/crm/leads.csv')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `globalcnb-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },

  users: () => call('/admin/users'),
  createUser: (data) => call('/admin/users', json('POST', data)),
  updateUser: (id, patch) => call(`/admin/users/${id}`, json('PATCH', patch)),
  audit: (params = {}) => call(`/admin/audit?${new URLSearchParams(Object.entries(params).filter(([, v]) => v))}`),
}
