import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({ mode: 'light' }), // 'light' | 'dark'
  actions: {
    initTheme() {
      const saved = localStorage.getItem('app_theme')
      this.mode = saved === 'dark' ? 'dark' : 'light'
      this.applyTheme()
    },
    toggleTheme() {
      this.setTheme(this.mode === 'dark' ? 'light' : 'dark')
    },
    setTheme(mode) {
      this.mode = mode
      localStorage.setItem('app_theme', mode)
      this.applyTheme()
    },
    applyTheme() {
      const root = document.documentElement
      if (this.mode === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
    },
  },
})
