import { createRouter, createWebHistory } from 'vue-router';
import DiscoverDna from '@/pages/DiscoverDna.vue';
import Home from '@/pages/Home.vue';
import ImageSpread from '@/pages/ImageSpread.vue';
import Login from '@/pages/Login.vue';
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
import Playground from '@/pages/Playground.vue';
import SignUp from '@/pages/SignUp.vue';
import StyleDna from '@/pages/StyleDna.vue';
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
      path: '/discover-dna',
      name: 'discover-dna',
      component: DiscoverDna
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/images/:imageId/spread',
      name: 'image-spread',
      component: ImageSpread
    },
    {
      path: '/sign-up',
      name: 'sign-up',
      component: SignUp
    },
    {
      path: '/moodboard/:slug?',
      name: 'moodboard',
      component: MoodboardOrbit
    },
    {
      path: '/playground',
      name: 'playground',
      component: Playground
    },
    {
      path: '/style-dna',
      name: 'style-dna',
      component: StyleDna
    },
    {
      path: '/style-dna/result',
      name: 'style-dna-result',
      component: StyleDnaResult
    }
  ]
});

export default router;
