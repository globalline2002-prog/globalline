// 계정 관리 명령 (서버를 멈춘 상태에서 실행하세요. 실행 중에는 관리 화면을 사용합니다.)
//   npm run user -- list
//   npm run user -- create <아이디> --name 이름 --role admin|staff|partner [--code 코드]
//   npm run user -- reset <아이디>        임시 비밀번호 재발급
//   npm run user -- disable <아이디>      계정 비활성화
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword, publicUser, randomPassword, validateUserInput } from './auth.js'
import { createAudit } from './audit.js'
import { createCollection } from './store.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
try {
  process.loadEnvFile(path.join(root, '.env'))
} catch {
  // .env 없음
}
const DATA_DIR = process.env.DATA_DIR || path.join(root, 'data')
const users = createCollection(DATA_DIR, 'users')
const audit = createAudit(DATA_DIR)

const [cmd, username, ...rest] = process.argv.slice(2)
const opts = {}
for (let i = 0; i < rest.length; i += 2) opts[rest[i].replace(/^--/, '')] = rest[i + 1]
const cliActor = { userId: 'cli', username: 'cli', role: 'admin', ip: 'local' }

function fail(msg) {
  console.error(`오류: ${msg}`)
  process.exit(1)
}

async function findUser() {
  const u = await users.find((x) => x.username === String(username || '').toLowerCase())
  if (!u) fail(`계정을 찾을 수 없습니다: ${username}`)
  return u
}

if (cmd === 'list') {
  const all = await users.list()
  if (!all.length) console.log('계정이 없습니다.')
  for (const u of all.map(publicUser)) console.log(`${u.active ? ' ' : '×'} ${u.username.padEnd(16)} ${u.role.padEnd(8)} ${u.code.padEnd(12)} ${u.name}`)
} else if (cmd === 'create') {
  const password = randomPassword()
  const { value, error } = validateUserInput({ username, ...opts, password }, { requirePassword: true })
  if (error) fail(error)
  if (await users.find((u) => u.username === value.username)) fail('이미 사용 중인 아이디입니다')
  const u = await users.create({ ...value, active: true, passwordHash: await hashPassword(password), mustChangePassword: true })
  await audit.log({ action: 'user.create', ...cliActor, targetUserId: u.id, targetUsername: u.username, targetRole: u.role })
  console.log(`계정 생성: ${u.username} (${u.role})\n임시 비밀번호: ${password}\n첫 로그인 후 비밀번호를 변경해야 합니다.`)
} else if (cmd === 'reset') {
  const u = await findUser()
  const password = randomPassword()
  await users.update(u.id, { passwordHash: await hashPassword(password), mustChangePassword: true, active: true })
  await audit.log({ action: 'user.update', ...cliActor, targetUserId: u.id, targetUsername: u.username, changes: ['password'] })
  console.log(`임시 비밀번호: ${password}`)
} else if (cmd === 'disable') {
  const u = await findUser()
  await users.update(u.id, { active: false })
  await audit.log({ action: 'user.update', ...cliActor, targetUserId: u.id, targetUsername: u.username, changes: ['active'] })
  console.log(`비활성화: ${u.username}`)
} else {
  console.log('사용법: npm run user -- list | create <아이디> --name 이름 --role admin|staff|partner [--code 코드] | reset <아이디> | disable <아이디>')
  process.exit(cmd ? 1 : 0)
}
