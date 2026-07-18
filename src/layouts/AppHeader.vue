<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Languages, ChevronDown } from '@lucide/vue';
import { useAuthStore } from '@/stores/auth.store';
import { useStyleDnaStore } from '@/stores/style-dna.store';
import { useStyleTagModalStore } from '@/stores/styleTagModal.store';
import Button from '@/components/ui/Button.vue';
import UserMenu from '@/layouts/UserMenu.vue';
import TourControl from '@/components/feature/guide/TourControl.vue';
import { getImageById } from '@/services/image.service';
import { setLocale, SUPPORTED_LOCALES, type AppLocale } from '@/i18n';
import { SITE_LOGO_SRC } from '@/constants/assets.constants';
import { useUserTour } from '@/composables/guide/useUserTour';
import { useWelcomeTour } from '@/composables/guide/useWelcomeTour';
import { requestHomeTourStart } from '@/composables/guide/useHomeTourFlow';

const { locale } = useI18n();

const langMenuOpen = ref(false);
const langMenuRef = ref<HTMLElement | null>(null);
const currentLocaleLabel = computed(
  () => SUPPORTED_LOCALES.find((l) => l.value === locale.value)?.label ?? locale.value
);

function selectLocale(next: AppLocale) {
  setLocale(next);
  langMenuOpen.value = false;
}

function handleLangClickOutside(event: MouseEvent) {
  if (langMenuRef.value && !langMenuRef.value.contains(event.target as Node)) {
    langMenuOpen.value = false;
  }
}

onMounted(() => document.addEventListener('click', handleLangClickOutside, true));
onUnmounted(() => document.removeEventListener('click', handleLangClickOutside, true));

const siteLogoSrc = SITE_LOGO_SRC;
const imageSearchEntryIcon = '/images/image-search-entry.webp';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const styleDnaStore = useStyleDnaStore();
const styleTagModalStore = useStyleTagModalStore();
const userTour = useUserTour(computed(() => authStore.user?.id));
const welcomeTour = useWelcomeTour(computed(() => authStore.user?.id));
const userTourStatus = computed(() => userTour.state.value.status);
const userTourStep = computed(() => userTour.state.value.step);

const isPictureDetail = computed(
  () => route.name === 'picture-detail' && !!getImageById(route.params.imageId as string)
);
const isHome = computed(() => route.name === 'home');
// PictureDetail 平常把 AppHeader 縮到 60% 寬，讓頁面自己的「返回」列並排在右側 40%；
// 但 StyleTagModal 開著時那塊區域會被 modal 蓋住（見 StyleTagModal 的 z-index 說明），
// 縮寬就只剩右邊空一塊黑，不好看——modal 開著時 AppHeader 改滿版，蓋滿整排。
const useNarrowWidth = computed(() => isPictureDetail.value && !styleTagModalStore.isOpen);

const initials = computed(() =>
  (authStore.user?.displayName ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
);

function goToMoodboard() {
  router.push({ name: 'moodboard' });
}

function goToStyleDna() {
  router.push(styleDnaStore.hasCompletedQuiz ? '/style-dna/result' : '/discover-dna');
}

function goToConsultations() {
  router.push({ name: 'account-consultations' });
}

async function handleLogout() {
  try {
    await authStore.logout();
  } catch (e) {
    console.warn('[auth] 登出失敗：', e);
  }
  router.push({ name: 'home' });
}

function startUserTour(): void {
  if (isHome.value) {
    requestHomeTourStart();
    return;
  }

  welcomeTour.complete();
  userTour.start();
  void router.push({ name: 'home' });
}

function restartUserTour(): void {
  if (isHome.value) {
    requestHomeTourStart();
    return;
  }

  welcomeTour.complete();
  userTour.restart();
  void router.push({ name: 'home' });
}

function resumeUserTour(): void {
  const step = userTour.state.value.step;
  const targetImageId = userTour.state.value.targetImageId;
  if (!step) return;

  userTour.resume();

  if (step === 'home-overview' || step === 'home-image') {
    void router.push({ name: 'home' });
    return;
  }

  if (
    (step === 'spread-related-group' || step === 'spread-related-image') &&
    targetImageId
  ) {
    void router.push({ name: 'image-spread', params: { imageId: targetImageId } });
    return;
  }

  if (
    (step === 'detail-thumbnail' || step === 'detail-style-tag' || step === 'detail-save') &&
    targetImageId
  ) {
    void router.push({ name: 'picture-detail', params: { imageId: targetImageId } });
    return;
  }

  void router.push({ name: 'home' });
}
</script>

<template>
  <header
    data-tour-header
    :class="[
      /* z-[110]：故意高於 StyleTagModal 的 z-index:100，modal 開著時 AppHeader（logo／
         語言切換／個人選單，含下拉展開的選單本身）仍蓋在最上層可操作，方便中英對照
         review（una-hsieh review 意見）。全站其餘覆蓋層都在 z-60 以下，不受影響。 */
      'fixed top-0 z-[110] flex items-center justify-between px-8 py-4 border-b border-white/5 bg-deep/80 backdrop-blur-xl',
      useNarrowWidth ? 'max-md:hidden md:w-3/5' : 'w-full'
    ]"
  >
    <button
      type="button"
      class="flex items-center gap-2 cursor-pointer transition-opacity duration-200 hover:opacity-75"
      @click="router.push({ name: 'home' })"
    >
      <img class="w-8 h-8" :src="siteLogoSrc" alt="Asterism" />
    </button>

    <div class="flex items-center gap-3">
      <div
        ref="langMenuRef"
        class="relative"
        data-tour-interactive="language"
        @keydown.esc="langMenuOpen = false"
      >
        <button
          type="button"
          class="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium tracking-wide text-text-secondary backdrop-blur-sm cursor-pointer touch-manipulation transition-[transform,color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 hover:text-text-primary active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dim/40 motion-reduce:transition-none"
          :class="langMenuOpen ? 'border-gold-dim/30 text-text-primary shadow-[0_0_0_1px_rgba(168,137,58,0.14)]' : ''"
          aria-haspopup="menu"
          :aria-expanded="langMenuOpen"
          :aria-label="$t('common.language')"
          @click.stop="langMenuOpen = !langMenuOpen"
        >
          <Languages class="size-3.5 opacity-60 transition-opacity duration-200 group-hover:opacity-90" />
          <span class="min-w-[42px] text-center">{{ currentLocaleLabel }}</span>
          <ChevronDown class="size-3 shrink-0 opacity-60 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" :class="langMenuOpen ? 'rotate-180' : ''" />
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          enter-from-class="opacity-0 -translate-y-1 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-150 ease-[cubic-bezier(0.4,0,1,1)] motion-reduce:transition-none"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-1 scale-95"
        >
          <ul
            v-if="langMenuOpen"
            role="menu"
            class="absolute right-0 top-[calc(100%+10px)] w-36 origin-top-right rounded-2xl border border-white/8 bg-elevated/90 py-1.5 backdrop-blur-xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-white/[0.02] overflow-hidden"
          >
            <li v-for="opt in SUPPORTED_LOCALES" :key="opt.value" role="none">
              <button
                type="button"
                role="menuitemradio"
                :aria-checked="locale === opt.value"
                class="relative w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer text-left transition-colors duration-150 hover:bg-white/5 focus-visible:outline-none focus-visible:bg-white/[0.07] active:scale-[0.985]"
                :class="locale === opt.value ? 'text-stellar-red font-medium' : 'text-text-secondary hover:text-text-primary'"
                @click="selectLocale(opt.value)"
              >
                <span
                  v-if="locale === opt.value"
                  class="absolute left-1.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-stellar-red"
                  aria-hidden="true"
                />
                {{ opt.label }}
              </button>
            </li>
          </ul>
        </Transition>
      </div>

      <TourControl
        v-if="authStore.isAuthenticated"
        :status="userTourStatus"
        :step="userTourStep"
        @start="startUserTour"
        @resume="resumeUserTour"
        @restart="restartUserTour"
      />

      <template v-if="!authStore.isAuthenticated">
        <Button variant="ghost" class="min-w-[80px] text-center" @click="router.push({ name: 'login' })">{{ $t('nav.login') }}</Button>
        <Button variant="primary" class="min-w-[88px] text-center" @click="router.push({ name: 'sign-up' })">{{ $t('nav.signup') }}</Button>
      </template>

      <UserMenu
        v-else
        :display-name="authStore.user?.displayName ?? ''"
        :initials="initials"
        @moodboard="goToMoodboard"
        @style-dna="goToStyleDna"
        @consultations="goToConsultations"
        @logout="handleLogout"
      />
    </div>
  </header>

  <router-link
    v-if="isHome"
    :to="{ name: 'image-search' }"
    class="fixed bottom-4 right-4 z-50 size-9 shrink-0 overflow-hidden rounded-full shadow-lg sm:hidden"
    :aria-label="$t('imageSearch.title')"
    :title="$t('imageSearch.title')"
  >
    <img :src="imageSearchEntryIcon" alt="" class="size-full" />
  </router-link>
</template>
