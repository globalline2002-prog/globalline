const env = import.meta.env

// 플랫폼 연동 설정. 외부 시스템이 준비되면 .env 의 VITE_* 값만 채우면 연결됩니다.
// 값이 비어 있으면 사이트 안의 내장 기능(내장 CRM, 상담 신청 등)으로 대신 연결합니다.
export const platform = {
  // 비우면 내장 서버(/api/leads)로 접수합니다. 외부 CRM API로 직접 보내려면 그 주소를 넣으세요.
  crmEndpoint: env.VITE_CRM_ENDPOINT || '/api/leads',
  crmPublicKey: env.VITE_CRM_PUBLIC_KEY || '',
  lmsUrl: env.VITE_LMS_URL || '',
  levelTestUrl: env.VITE_LEVEL_TEST_URL || '',
  partnerPortalUrl: env.VITE_PARTNER_PORTAL_URL || '',
  staffCrmUrl: env.VITE_STAFF_CRM_URL || '',
  institutionPortalUrl: env.VITE_INSTITUTION_PORTAL_URL || '',
  contactEmail: env.VITE_CONTACT_EMAIL || 'contact@globalcnb.com',
  kakaoChannelUrl: env.VITE_KAKAO_CHANNEL_URL || '',
}

// 외부 시스템이 아직 없을 때 연결할 사이트 내부 경로
const fallbacks = {
  lms: '#/consult/form',
  levelTest: '#/consult/form',
  partner: '#/consult/partners',
  staff: '#/admin', // 내장 CRM 관리 화면
  institution: '#/consult/institutions',
}

const urls = {
  lms: platform.lmsUrl,
  levelTest: platform.levelTestUrl,
  partner: platform.partnerPortalUrl,
  staff: platform.staffCrmUrl,
  institution: platform.institutionPortalUrl,
}

// { href, external, ready } — ready 가 false 면 화면에 '오픈 예정'으로 표시합니다.
export function platformLink(key) {
  if (urls[key]) return { href: urls[key], external: true, ready: true }
  return { href: fallbacks[key], external: false, ready: key === 'staff' }
}

export function linkProps(link) {
  return link.external ? { href: link.href, target: '_blank', rel: 'noreferrer' } : { href: link.href }
}
