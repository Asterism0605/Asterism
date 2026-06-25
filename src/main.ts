import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { useStyleDnaStore } from './stores/style-dna.store'
import { useAuthStore } from './stores/auth.store'

const pinia = createPinia()
useStyleDnaStore(pinia).hydrateResult()

void (async () => {
  // hydrate 失敗（Supabase 連不到 / env 未設）也要照常 mount，否則整站白屏。
  try {
    await useAuthStore(pinia).hydrate()
  } catch (e) {
    console.warn('[auth] 啟動還原失敗：', e)
  }
  createApp(App).use(pinia).use(router).mount('#app')
})()
