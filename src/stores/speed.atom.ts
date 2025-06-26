import { atomWithStorage } from 'jotai/utils'

export const speedAtom = atomWithStorage<number>('speed', 4, {
  getItem: (key, initialValue) => {
    const value = localStorage.getItem(key)
    return value !== null ? parseFloat(value) : initialValue
  },
  setItem: (key, newValue) => {
    localStorage.setItem(key, newValue.toString())
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
  },
}, {
  getOnInit: true,
})
