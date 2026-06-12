import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/pages/Home.vue';
import Login from '@/pages/Login.vue';
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
import Playground from '@/pages/Playground.vue';
import SignUp from '@/pages/SignUp.vue';
import StyleDnaResult from '@/pages/StyleDnaResult.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/moodboard',
      name: 'moodboard',
      component: MoodboardOrbit
    },
    {
      path: '/playground',
      name: 'playground',
      component: Playground
    },
    {
      path: '/sign-up',
      name: 'sign-up',
      component: SignUp
    },
    {
      path: '/style-dna-result',
      name: 'style-dna-result',
      component: StyleDnaResult
    }
  ]
});

export default router;
