import { atom } from 'jotai'

export type Theme = 'light' | 'dark' | 'system'

const setTheme = (theme: Theme) => {
  const root = document.documentElement
  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.classList.add(systemTheme)
    return
  }

  root.classList.add(theme)
}

export const themeAtom = atom<Theme, [Theme], void>('system', (_, set, update) => {
  setTheme(update)
  localStorage.setItem('theme', update)
  set(themeAtom, update)
})
themeAtom.onMount = (set) => {
  const savedTheme = localStorage.getItem('theme') as Theme | null
  const initialTheme = savedTheme ?? 'system'
  setTheme(initialTheme)
  set(initialTheme)
}
