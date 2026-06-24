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
  await useAuthStore(pinia).hydrate()
  createApp(App).use(pinia).use(router).mount('#app')
})()
