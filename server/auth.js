import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb)

export const ROLES = ['admin', 'staff', 'partner']
export const MIN_PASSWORD = 10
const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8시간

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored || '').split('$')
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length)
  return timingSafeEqual(actual, expected)
}

export function randomPassword() {
  // 혼동하기 쉬운 문자(0/O, 1/l) 제외, 14자
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from(randomBytes(14), (b) => chars[b % chars.length]).join('')
}

// 클라이언트에 내보내도 되는 사용자 정보
export function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    code: u.code || '',
    active: u.active !== false,
    mustChangePassword: Boolean(u.mustChangePassword),
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt || null,
  }
}

export function validateUserInput(body, { requirePassword }) {
  const username = String(body.username || '').trim().toLowerCase()
  const name = String(body.name || '').trim().slice(0, 60)
  const role = String(body.role || '')
  const code = String(body.code || '').trim().toUpperCase().slice(0, 40)
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return { error: '아이디는 영문 소문자·숫자·._- 3~32자' }
  if (!name) return { error: '이름을 입력하세요' }
  if (!ROLES.includes(role)) return { error: '역할이 올바르지 않습니다' }
  if (role === 'partner' && !code) return { error: '유학원 계정에는 파트너 코드가 필요합니다' }
  if (requirePassword && String(body.password || '').length < MIN_PASSWORD) {
    return { error: `비밀번호는 ${MIN_PASSWORD}자 이상` }
  }
  return { value: { username, name, role, code } }
}

// 메모리 세션: 서버를 재시작하면 다시 로그인해야 합니다.
export function createSessions() {
  const sessions = new Map()
  return {
    create(userId) {
      const token = randomBytes(32).toString('base64url')
      sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS })
      return token
    },
    get(token) {
      const s = token && sessions.get(token)
      if (!s) return null
      if (s.expiresAt < Date.now()) {
        sessions.delete(token)
        return null
      }
      s.expiresAt = Date.now() + SESSION_TTL_MS // 사용 중이면 연장
      return s
    },
    delete(token) {
      sessions.delete(token)
    },
    deleteUser(userId) {
      for (const [t, s] of sessions) if (s.userId === userId) sessions.delete(t)
    },
  }
}

// 로그인 실패 제한: 같은 IP+아이디로 15분에 5회
export function createLoginThrottle() {
  const fails = new Map()
  const key = (ip, username) => `${ip}|${username}`
  return {
    blocked(ip, username) {
      const list = (fails.get(key(ip, username)) || []).filter((t) => Date.now() - t < 15 * 60 * 1000)
      fails.set(key(ip, username), list)
      return list.length >= 5
    },
    fail(ip, username) {
      const k = key(ip, username)
      fails.set(k, [...(fails.get(k) || []), Date.now()])
    },
    reset(ip, username) {
      fails.delete(key(ip, username))
    },
  }
}
