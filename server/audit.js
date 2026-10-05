import { appendFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

// 열람·변경 기록: data/audit.log 에 한 줄에 한 건(JSON)씩 추가만 합니다(수정·삭제 API 없음).
export function createAudit(dataDir) {
  const file = path.join(dataDir, 'audit.log')
  let writing = Promise.resolve()

  return {
    log(entry) {
      const line = JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n'
      writing = writing.then(async () => {
        await mkdir(dataDir, { recursive: true })
        await appendFile(file, line, { mode: 0o600 })
      })
      return writing
    },
    // 최신순으로 조건에 맞는 기록을 반환합니다.
    async query({ userId, action, leadId, limit = 200 } = {}) {
      await writing
      let text = ''
      try {
        text = await readFile(file, 'utf8')
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
      }
      const out = []
      const lines = text.trimEnd().split('\n')
      for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
        if (!lines[i]) continue
        let e
        try {
          e = JSON.parse(lines[i])
        } catch {
          continue
        }
        if (userId && e.userId !== userId) continue
        if (action && e.action !== action) continue
        if (leadId && e.leadId !== leadId && !(e.leadIds || []).includes(leadId)) continue
        out.push(e)
      }
      return out
    },
  }
}
