import { defineStore } from 'pinia'

let idCounter = 0

export const useToastStore = defineStore('toast', {
  state: () => ({ toasts: [] }),
  actions: {
    push(message, type = 'info', duration = 3000) {
      const id = ++idCounter
      this.toasts.push({ id, message, type })
      setTimeout(() => this.remove(id), duration)
    },
    success(message) { this.push(message, 'success') },
    error(message) { this.push(message, 'error') },
    info(message) { this.push(message, 'info') },
    remove(id) { this.toasts = this.toasts.filter((t) => t.id !== id) },
  },
})
