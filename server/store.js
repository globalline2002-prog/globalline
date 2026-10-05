import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

// 내장 저장소: 컬렉션마다 JSON 파일 하나(leads.json, users.json)에 보관합니다.
// 외부 CRM·DB로 옮길 때는 이 파일의 함수만 교체하면 됩니다.
export const STATUSES = ['new', 'contacted', 'level-test', 'enrolled', 'lost']

export function createCollection(dataDir, name) {
  const file = path.join(dataDir, `${name}.json`)
  let items = null
  let writing = Promise.resolve()

  async function load() {
    if (items) return items
    try {
      items = JSON.parse(await readFile(file, 'utf8'))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      items = []
    }
    return items
  }

  // 쓰기를 직렬화하고 임시 파일 → rename 으로 원자적으로 저장합니다.
  function persist() {
    writing = writing.then(async () => {
      await mkdir(dataDir, { recursive: true })
      const tmp = `${file}.${process.pid}.tmp`
      await writeFile(tmp, JSON.stringify(items, null, 2), { mode: 0o600 })
      await rename(tmp, file)
    })
    return writing
  }

  return {
    async list() {
      return [...(await load())].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async get(id) {
      return (await load()).find((x) => x.id === id)
    },
    async find(fn) {
      return (await load()).find(fn)
    },
    async create(data) {
      await load()
      const now = new Date().toISOString()
      const item = { id: randomUUID(), createdAt: now, updatedAt: now, ...data }
      items.push(item)
      await persist()
      return item
    },
    async update(id, patch) {
      await load()
      const item = items.find((x) => x.id === id)
      if (!item) return null
      Object.assign(item, patch, { updatedAt: new Date().toISOString() })
      await persist()
      return item
    },
  }
}

// 상담 신청(리드) 기본값
export function newLead(data) {
  return { status: 'new', assigneeId: '', assignee: '', notes: [], forward: null, ...data }
}
