// 내장 CRM 화면 공용 컴포넌트
import { platform, platformLink } from '../../config'
import { STATUS_LABEL, STATUS_STYLE } from './labels'

export function StatusBadge({ status }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
}

export function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-extrabold text-ink">{title}</p>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

export function ErrorText({ children }) {
  return children ? <p className="mt-3 text-sm font-semibold text-red-600">{children}</p> : null
}

export function ConnectionPanel({ webhook }) {
  const ext = (key, envName) => (platformLink(key).external ? ['연결됨', true] : [`미연결 — ${envName}`, false])
  const items = [
    ['상담 접수', platform.crmEndpoint === '/api/leads' ? '내장 서버' : '외부 CRM 직접', true],
    ['외부 CRM 전달 (Webhook)', ...(webhook ? ['연결됨', true] : ['미연결 — CRM_WEBHOOK_URL', false])],
    ['학생 LMS', ...ext('lms', 'VITE_LMS_URL')],
    ['레벨테스트', ...ext('levelTest', 'VITE_LEVEL_TEST_URL')],
    ['유학원 포털', platform.partnerPortalUrl ? '외부 연결됨' : '내장 CRM 사용 중', true],
    ['직원 CRM', platform.staffCrmUrl ? '외부 연결됨' : '내장 CRM 사용 중', true],
    ['대학·기업 포털', ...ext('institution', 'VITE_INSTITUTION_PORTAL_URL')],
  ]
  return (
    <Card title="플랫폼 연결 상태">
      <ul className="space-y-2 text-sm">
        {items.map(([k, v, ok]) => (
          <li key={k} className="flex items-center justify-between gap-3">
            <span>{k}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ok ? 'bg-lime-soft text-ink' : 'bg-slate-100 text-slate-500'}`}>{v}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
