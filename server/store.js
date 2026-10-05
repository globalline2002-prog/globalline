import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

// 내장 CRM 저장소: JSON 파일 하나에 리드를 보관합니다.
// 외부 CRM·DB로 옮길 때는 이 파일의 함수만 교체하면 됩니다.
export const STATUSES = ['new', 'contacted', 'level-test', 'enrolled', 'lost']

export function createStore(dataDir) {
  const file = path.join(dataDir, 'leads.json')
  let leads = null
  let writing = Promise.resolve()

  async function load() {
    if (leads) return leads
    try {
      leads = JSON.parse(await readFile(file, 'utf8'))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      leads = []
    }
    return leads
  }

  // 쓰기를 직렬화하고 임시 파일 → rename 으로 원자적으로 저장합니다.
  function persist() {
    writing = writing.then(async () => {
      await mkdir(dataDir, { recursive: true })
      const tmp = `${file}.${process.pid}.tmp`
      await writeFile(tmp, JSON.stringify(leads, null, 2))
      await rename(tmp, file)
    })
    return writing
  }

  return {
    async list() {
      return [...(await load())].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async get(id) {
      return (await load()).find((l) => l.id === id)
    },
    async create(data) {
      await load()
      const now = new Date().toISOString()
      const lead = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        status: 'new',
        assignee: '',
        notes: [],
        forward: null,
        ...data,
      }
      leads.push(lead)
      await persist()
      return lead
    },
    async update(id, patch) {
      await load()
      const lead = leads.find((l) => l.id === id)
      if (!lead) return null
      Object.assign(lead, patch, { updatedAt: new Date().toISOString() })
      await persist()
      return lead
    },
  }
}
