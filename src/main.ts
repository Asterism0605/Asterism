import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { useStyleDnaStore } from './stores/style-dna.store'

const pinia = createPinia()
useStyleDnaStore(pinia).hydrateResult()

createApp(App).use(pinia).use(router).mount('#app')
