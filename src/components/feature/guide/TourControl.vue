<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowRight, Play, RotateCcw } from '@lucide/vue';
import type { UserTourStatus, UserTourStep } from '@/composables/guide/useUserTour';
import DropdownMenu from '@/components/ui/DropdownMenu.vue';

const props = defineProps<{
  status: UserTourStatus;
  step: UserTourStep | null;
}>();

const emit = defineEmits<{
  start: [];
  resume: [];
  restart: [];
}>();

const { t } = useI18n();
const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const TARGET_ICON_SRC = '/images/target.png';

const STEP_PROGRESS_KEYS: Record<UserTourStep, string> = {
  'home-overview': 'userTour.control.progress.home',
  'home-image': 'userTour.control.progress.home',
  'spread-related-group': 'userTour.control.progress.spread',
  'spread-related-image': 'userTour.control.progress.spread',
  'detail-thumbnail': 'userTour.control.progress.detail',
  'detail-style-tag': 'userTour.control.progress.detail',
  'detail-save': 'userTour.control.progress.detail'
};

const isDisabled = computed(() => props.status === 'active');
const isPaused = computed(() => props.status === 'paused');
const isCompleted = computed(() => props.status === 'completed');
const progressLabel = computed(() => (props.step ? t(STEP_PROGRESS_KEYS[props.step]) : ''));

function closeMenu(): void {
  isOpen.value = false;
}

function toggleMenu(): void {
  if (!isDisabled.value) isOpen.value = !isOpen.value;
}

function handleStart(): void {
  closeMenu();
  emit('start');
}

function handleResume(): void {
  closeMenu();
  emit('resume');
}

function handleRestart(): void {
  closeMenu();
  emit('restart');
}

function handleClickOutside(event: MouseEvent): void {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) closeMenu();
}

onMounted(() => document.addEventListener('click', handleClickOutside, true));
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside, true));
</script>

<template>
  <div ref="rootRef" class="relative" data-tour-control>
    <button
      type="button"
      data-testid="user-tour-control-trigger"
      class="group flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/[0.03] p-1.5 text-text-primary shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-[border-color,box-shadow,opacity,transform] duration-200 hover:border-gold-dim/60 hover:shadow-[0_0_24px_rgba(168,137,58,0.24)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dim/70 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-white/15 disabled:hover:shadow-none motion-reduce:transition-none"
      :disabled="isDisabled"
      :aria-disabled="isDisabled"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      :aria-label="t('userTour.control.open')"
      :title="t('userTour.control.title')"
      @click.stop="toggleMenu"
      @keydown.esc="closeMenu"
    >
      <img
        :src="TARGET_ICON_SRC"
        alt=""
        class="size-full object-contain opacity-90 transition-opacity duration-200 group-hover:opacity-100"
      />
    </button>

    <DropdownMenu
      :open="isOpen"
      panel-class="w-46"
      panel-test-id="user-tour-control-menu"
      role="menu"
    >
      <div
        data-testid="user-tour-control-header"
        class="border-white/10 px-4 py-3"
        :class="{ 'border-b': !isCompleted }"
      >
        <p class="text-sm font-medium text-text-primary">{{ t('userTour.control.title') }}</p>
        <p v-if="isPaused && progressLabel" class="mt-1 text-xs text-text-secondary">
          {{ t('userTour.control.lastProgress', { progress: progressLabel }) }}
        </p>
      </div>

      <button
        v-if="!isPaused && !isCompleted"
        type="button"
        role="menuitem"
        data-testid="user-tour-start"
        class="cursor-pointer flex w-full items-start px-4 py-3 text-left transition-colors hover:bg-white/6 focus-visible:bg-white/8 focus-visible:outline-none"
        @click="handleStart"
      >
        <Play class="mr-3 mt-0.5 size-4 shrink-0 text-text-primary" aria-hidden="true" />
        <span>
          <span class="block text-sm font-medium text-text-primary">{{
            t('userTour.control.start')
          }}</span>
          <span class="mt-0.5 block text-xs leading-5 text-text-secondary">{{
            t('userTour.control.startDescription')
          }}</span>
        </span>
      </button>

      <button
        v-if="isPaused"
        type="button"
        role="menuitem"
        data-testid="user-tour-resume"
        class="cursor-pointer flex w-full items-start px-4 py-3 text-left transition-colors hover:bg-white/6 focus-visible:bg-white/8 focus-visible:outline-none"
        @click="handleResume"
      >
        <ArrowRight class="mr-3 mt-0.5 size-4 shrink-0 text-text-primary" aria-hidden="true" />
        <span>
          <span class="block text-sm font-medium text-text-primary">{{
            t('userTour.control.resume')
          }}</span>
          <span class="mt-0.5 block text-xs leading-5 text-text-secondary">{{
            t('userTour.control.resumeDescription')
          }}</span>
        </span>
      </button>

      <div v-if="isPaused || isCompleted" class="border-t border-white/10">
        <button
          type="button"
          role="menuitem"
          data-testid="user-tour-restart"
          class="cursor-pointer flex w-full items-center px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:bg-white/6 hover:text-text-primary focus-visible:bg-white/8 focus-visible:outline-none"
          @click="handleRestart"
        >
          <RotateCcw class="mr-3 size-4 shrink-0 opacity-60" aria-hidden="true" />
          {{ isCompleted ? t('userTour.control.replay') : t('userTour.control.restart') }}
        </button>
      </div>
    </DropdownMenu>
  </div>
</template>
