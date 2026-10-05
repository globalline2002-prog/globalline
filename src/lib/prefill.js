const KEY = 'gcnb_prefill'
export const PREFILL_EVENT = 'gcnb:prefill'

// 과정 찾기 결과·파트너 버튼 값을 상담 신청서로 넘깁니다.
export function setPrefill(data) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // 무시
  }
  // 신청서가 이미 화면에 있으면 즉시 반영되도록 알립니다.
  window.dispatchEvent(new Event(PREFILL_EVENT))
}

export function takePrefill() {
  try {
    const raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
