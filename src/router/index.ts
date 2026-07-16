import { createRouter, createWebHistory } from 'vue-router';
import DiscoverDna from '@/pages/DiscoverDna.vue';
import Home from '@/pages/Home.vue';
import ImageSearch from '@/pages/ImageSearch.vue';
import ImageSpread from '@/pages/ImageSpread.vue';
import Login from '@/pages/Login.vue';
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
import Playground from '@/pages/Playground.vue';
import PictureDetail from '@/pages/PictureDetail.vue';
import SignUp from '@/pages/SignUp.vue';
import StyleDna from '@/pages/StyleDna.vue';
import StyleDnaResult from '@/pages/StyleDnaResult.vue';
import StyleConsultant from '@/pages/StyleConsultant.vue';
import Privacy from '@/pages/Privacy.vue';
import Terms from '@/pages/Terms.vue';
import AuthCallback from '@/pages/AuthCallback.vue';
import Review from '@/pages/Review.vue';
import { getImageById } from '@/services/image.service';
import { resolveAuthGuard } from '@/router/authGuard';
import { useAuthStore } from '@/stores/auth.store';

function getRouteImageId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

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
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallback
    },
    {
      path: '/images/:imageId/spread',
      name: 'image-spread',
      component: ImageSpread
    },
    {
      path: '/search-by-image',
      name: 'image-search',
      component: ImageSearch
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
      path: '/images/:imageId',
      name: 'picture-detail',
      component: PictureDetail
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
    },
    {
      path: '/consultant',
      name: 'consultant',
      component: StyleConsultant
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: Privacy
    },
    {
      path: '/terms',
      name: 'terms',
      component: Terms
    },
    {
      path: '/review',
      name: 'review',
      component: Review,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/Error.vue'),
      meta: { errorType: '404' }
    }
  ]
});

router.beforeEach((to) => {
  if (to.name !== 'picture-detail') {
    return true;
  }

  const rawImageId = to.params.imageId;
  const imageId =
    typeof rawImageId === 'string' || Array.isArray(rawImageId) ? getRouteImageId(rawImageId) : '';

  if (imageId && getImageById(imageId)) {
    return true;
  }

  return {
    name: 'not-found',
    params: { pathMatch: to.path.replace(/^\//, '').split('/') },
    query: to.query,
    hash: to.hash
  };
});

// 路由型別擴充：讓 meta.requiresAuth / requiresAdmin 有型別
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
  }
}

router.beforeEach((to) => {
  const auth = useAuthStore();
  return resolveAuthGuard(
    { requiresAuth: to.meta.requiresAuth, requiresAdmin: to.meta.requiresAdmin },
    to.fullPath,
    { isAuthenticated: auth.isAuthenticated, isAdmin: auth.isAdmin }
  );
});

export default router;
