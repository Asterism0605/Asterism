import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/pages/Home.vue';
import Playground from '@/pages/Playground.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/playground',
      name: 'playground',
      component: Playground
    }
  ]
});

export default router;
