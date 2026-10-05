import { createContext, useContext } from 'react'

export const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
  { code: 'uz', label: 'Oʻzbekcha' },
  { code: 'mn', label: 'Монгол' },
]

export const LangContext = createContext(null)

export function useLang() {
  return useContext(LangContext)
}
