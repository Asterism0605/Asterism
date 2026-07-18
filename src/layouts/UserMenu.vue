<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { CalendarCheck, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Sparkles } from '@lucide/vue';

withDefaults(
  defineProps<{
    displayName: string;
    initials: string;
    /** 顧問帳號才顯示「被指派的諮詢」入口(#208)。 */
    isConsultant?: boolean;
  }>(),
  { isConsultant: false }
);

const emit = defineEmits<{
  moodboard: [];
  consultations: [];
  consultantBookings: [];
  styleDna: [];
  logout: [];
}>();

const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu();
  }
}

function handleMoodboard() {
  closeMenu();
  emit('moodboard');
}

function handleStyleDna() {
  closeMenu();
  emit('styleDna');
}

function handleConsultations() {
  closeMenu();
  emit('consultations');
}

function handleConsultantBookings() {
  closeMenu();
  emit('consultantBookings');
}

function handleLogout() {
  closeMenu();
  emit('logout');
}

onMounted(() => document.addEventListener('click', handleClickOutside, true));
onUnmounted(() => document.removeEventListener('click', handleClickOutside, true));
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-full cursor-pointer transition-opacity duration-200 hover:opacity-80"
      :aria-expanded="menuOpen"
      aria-haspopup="true"
      @click.stop="toggleMenu"
    >
      <div
        class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-dim text-xs font-semibold text-text-primary select-none ring-2 ring-transparent transition-all duration-200"
        :class="menuOpen ? 'ring-gold-dim/60' : ''"
        :title="displayName"
      >
        {{ initials }}
      </div>
      <span class="hidden sm:block text-sm text-text-secondary truncate max-w-[120px]">
        {{ displayName }}
      </span>
      <ChevronDown class="size-4 shrink-0 opacity-60" :class="menuOpen ? 'rotate-180' : ''" />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="menuOpen"
        class="absolute right-0 top-[calc(100%+10px)] w-44 origin-top-right rounded-2xl border border-white/8 bg-elevated/90 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        <div class="px-4 py-3 border-b border-white/8">
          <p class="text-xs text-text-secondary truncate">{{ $t('userMenu.signedInAs') }}</p>
          <p class="text-sm font-medium text-text-primary truncate mt-0.5">
            {{ displayName }}
          </p>
        </div>

        <ul class="py-1.5">
          <li>
            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors duration-150 cursor-pointer text-left"
              @click="handleMoodboard"
            >
              <LayoutDashboard class="size-4 shrink-0 opacity-60" />
              {{ $t('userMenu.moodboard') }}
            </button>
          </li>

          <li>
            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors duration-150 cursor-pointer text-left"
              @click="handleStyleDna"
            >
              <Sparkles class="size-4 shrink-0 opacity-60" />
              {{ $t('userMenu.styleDna') }}
            </button>
          </li>

          <li>
            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors duration-150 cursor-pointer text-left"
              @click="handleConsultations"
            >
              <CalendarCheck class="size-4 shrink-0 opacity-60" />
              {{ $t('userMenu.myConsultations') }}
            </button>
          </li>

          <li v-if="isConsultant">
            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors duration-150 cursor-pointer text-left"
              @click="handleConsultantBookings"
            >
              <ClipboardList class="size-4 shrink-0 opacity-60" />
              {{ $t('userMenu.consultantBookings') }}
            </button>
          </li>

          <li class="mt-1 border-t border-white/8">
            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-stellar-red hover:bg-stellar-red/8 transition-colors duration-150 cursor-pointer text-left"
              @click="handleLogout"
            >
              <LogOut class="size-4 shrink-0 opacity-60" />
              {{ $t('userMenu.logout') }}
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
