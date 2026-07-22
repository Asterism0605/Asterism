import { createRouter, createWebHistory } from 'vue-router';
import DiscoverDna from '@/pages/DiscoverDna.vue';
import Home from '@/pages/Home.vue';
import ImageSpread from '@/pages/ImageSpread.vue';
import Login from '@/pages/Login.vue';
import MoodboardOrbit from '@/pages/MoodboardOrbit.vue';
import Playground from '@/pages/Playground.vue';
import PictureDetail from '@/pages/PictureDetail.vue';
import SignUp from '@/pages/SignUp.vue';
import ForgotPassword from '@/pages/ForgotPassword.vue';
import ResetPassword from '@/pages/ResetPassword.vue';
import StyleDna from '@/pages/StyleDna.vue';
import StyleDnaResult from '@/pages/StyleDnaResult.vue';
import StyleConsultant from '@/pages/StyleConsultant.vue';
import AccountConsultations from '@/pages/AccountConsultations.vue';
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
  // 此處只控制路由切換完成後的捲動位置，不負責偵測 Style DNA 結果頁的下滑行為。
  // `/style-dna/result` 的下滑門檻與 `router.push()` 寫在 StyleDnaResult.vue。
  scrollBehavior(to, _from, savedPosition) {
    if (
      (to.name === 'home' && to.query.source === 'style-dna') ||
      to.name === 'style-dna-result'
    ) {
      // 從 Style DNA 結果進入個人化首頁，或重新進入結果頁時，一律從頁面頂部開始。
      return { top: 0 };
    }

    // 瀏覽器上一頁／下一頁時恢復原本位置；其他情況不主動改變捲動位置。
    return savedPosition ?? undefined;
  },
  routes: [
    {
      path: '/',
      alias: '/home',
      name: 'home',
      component: Home
    },
    {
      path: '/discover-dna',
      name: 'discover-dna',
      component: DiscoverDna,
      meta: { requiresAuth: true }
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
      // Lazy load：這頁會拉進 CLIP/transformers.js 整條依賴鏈，不用讓每個使用者
      // 一進站就下載，比照既有 not-found 頁的寫法。
      component: () => import('@/pages/ImageSearch.vue')
    },
    {
      path: '/sign-up',
      name: 'sign-up',
      component: SignUp
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPassword
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPassword
    },
    {
      path: '/moodboard/:slug?',
      name: 'moodboard',
      component: MoodboardOrbit,
      meta: { requiresAuth: true }
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
      component: StyleDna,
      meta: { requiresAuth: true }
    },
    {
      path: '/style-dna/result',
      name: 'style-dna-result',
      component: StyleDnaResult,
      meta: { requiresAuth: true }
    },
    {
      path: '/consultant',
      name: 'consultant',
      component: StyleConsultant,
      meta: { requiresAuth: true }
    },
    {
      path: '/consultant/bookings',
      name: 'consultant-bookings',
      // Lazy load：顧問專用頁，一般使用者不需要載進 bundle。
      component: () => import('@/pages/ConsultantBookings.vue'),
      meta: { requiresConsultant: true }
    },
    {
      path: '/account/consultations',
      name: 'account-consultations',
      component: AccountConsultations,
      meta: { requiresAuth: true }
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

// 路由型別擴充：讓 meta.requiresAuth / requiresAdmin / requiresConsultant 有型別
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    requiresConsultant?: boolean;
  }
}

router.beforeEach((to) => {
  const auth = useAuthStore();
  return resolveAuthGuard(
    {
      requiresAuth: to.meta.requiresAuth,
      requiresAdmin: to.meta.requiresAdmin,
      requiresConsultant: to.meta.requiresConsultant
    },
    to.fullPath,
    { isAuthenticated: auth.isAuthenticated, isAdmin: auth.isAdmin, isConsultant: auth.isConsultant }
  );
});

export default router;
