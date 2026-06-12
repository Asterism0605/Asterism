import { createApp } from 'vue'
import './styles/main.css'
import RootApp from './RootApp.vue'
import { router } from './router'

createApp(RootApp).use(router).mount('#app')
