const env = import.meta.env

// 플랫폼 연동 주소. 배포 환경에서는 .env 의 VITE_* 값으로 덮어씁니다.
export const platform = {
  crmEndpoint: env.VITE_CRM_ENDPOINT || '',
  crmPublicKey: env.VITE_CRM_PUBLIC_KEY || '',
  lmsUrl: env.VITE_LMS_URL || 'https://lms.globalcnb.com',
  partnerPortalUrl: env.VITE_PARTNER_PORTAL_URL || 'https://partner.globalcnb.com',
  staffCrmUrl: env.VITE_STAFF_CRM_URL || 'https://crm.globalcnb.com',
  institutionPortalUrl: env.VITE_INSTITUTION_PORTAL_URL || 'https://campus.globalcnb.com',
  levelTestUrl: env.VITE_LEVEL_TEST_URL || 'https://lms.globalcnb.com/level-test',
  contactEmail: env.VITE_CONTACT_EMAIL || 'contact@globalcnb.com',
  kakaoChannelUrl: env.VITE_KAKAO_CHANNEL_URL || '',
}
