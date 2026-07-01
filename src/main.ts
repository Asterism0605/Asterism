import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { useStyleDnaStore } from './stores/style-dna.store'
import { useAuthStore } from './stores/auth.store'
import { loadImages } from './services/image.service'
import { useMoodboardStore } from './stores/moodboard.store'

const pinia = createPinia()
const styleDnaStore = useStyleDnaStore(pinia)
styleDnaStore.hydrateResult()
useMoodboardStore(pinia).hydrate()

void (async () => {
  // hydrate 失敗（Supabase 連不到 / env 未設）也要照常 mount，否則整站白屏。
  try {
    const authStore = useAuthStore(pinia)
    await authStore.hydrate()
    if (authStore.user?.id) {
      await styleDnaStore.reconcileWithServer(authStore.user.id)
    }
  } catch (e) {
    console.warn('[auth] 啟動還原失敗：', e)
  }
  // 啟動時把圖片快取換成 Supabase 資料；失敗 fetchImagesApi 已回打包 JSON，照常 mount。
  try {
    await loadImages()
  } catch (e) {
    console.warn('[image] 啟動載入失敗：', e)
  }
  createApp(App).use(pinia).use(router).use(i18n).mount('#app')
})()
