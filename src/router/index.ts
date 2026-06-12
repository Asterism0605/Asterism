import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import StyleDna from '@/pages/StyleDna.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: App,
    },
    {
      path: '/style-dna',
      name: 'style-dna',
      component: StyleDna,
    },
  ],
})
