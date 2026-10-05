import { useEffect, useMemo, useState } from 'react'
import { contents } from './content'
import { LangContext } from './lang'


const LANG_KEY = 'gcnb_lang'

// 번역 파일에 빠진 키는 한국어 원문으로 채웁니다(배열은 통째로 교체).
function merge(base, override) {
  if (override === undefined) return base
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return override
  const out = { ...base }
  for (const key of Object.keys(override)) out[key] = merge(base[key], override[key])
  return out
}

function initialLang() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (fromUrl && contents[fromUrl]) return fromUrl
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved && contents[saved]) return saved
  } catch {
    // 저장소 접근 불가
  }
  const browser = (navigator.language || 'ko').slice(0, 2)
  return contents[browser] ? browser : 'ko'
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang)
  const c = useMemo(() => merge(contents.ko, contents[lang]), [lang])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = c.meta.title
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // 무시
    }
  }, [lang, c])

  return <LangContext.Provider value={{ lang, setLang, c }}>{children}</LangContext.Provider>
}
