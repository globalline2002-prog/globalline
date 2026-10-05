import { useEffect, useState } from 'react'

export const pages = ['consult', 'about', 'pre-departure', 'd4', 'd2', 'career', 'news']
// 메뉴에 노출하지 않는 내부 페이지
const internalPages = ['admin']

// 해시 라우팅: #/page/section → { page, section }
function parse() {
  const [page = '', section = ''] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { page: pages.includes(page) || internalPages.includes(page) ? page : '', section }
}

export function href(route) {
  return `#/${route}`
}

export function useRoute() {
  const [route, setRoute] = useState(parse)

  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    if (!route.section) {
      window.scrollTo({ top: 0 })
      return
    }
    // 페이지 렌더 후 해당 섹션으로 이동
    const id = requestAnimationFrame(() => {
      document.getElementById(route.section)?.scrollIntoView({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [route.page, route.section])

  return route
}
