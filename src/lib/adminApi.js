// 내장 CRM 관리 API 클라이언트 (server/index.js)
const TOKEN_KEY = 'gcnb_admin_token'

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
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status })
  }
  return res.headers.get('content-type')?.includes('json') ? res.json() : res.text()
}

export const adminApi = {
  leads: () => call('/leads'),
  stats: () => call('/stats'),
  update: (id, patch) => call(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  forward: (id) => call(`/leads/${id}/forward`, { method: 'POST' }),
  async downloadCsv() {
    const text = await call('/leads.csv')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `globalcnb-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },
}
