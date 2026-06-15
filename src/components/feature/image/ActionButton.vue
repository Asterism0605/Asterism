<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface Props {
  variant?: 'bookmark' | 'consult';
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'bookmark',
  loading: false,
  error: null
});

const emit = defineEmits<{
  'create-folder': [];
  'save-to-folder': [];
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function handleOutsideClick(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<template>
  <div ref="containerRef" class="relative inline-block">
    <button
      type="button"
      :disabled="props.loading"
      :class="[
        'flex w-full cursor-pointer items-center justify-center gap-1 md:gap-2 rounded-full font-mono text-xs md:text-base uppercase tracking-widest text-text-primary transition-all duration-200 whitespace-nowrap',
        props.variant === 'consult'
          ? 'bg-white/10 px-3 py-3 md:px-4 md:py-4 hover:bg-white/15'
          : 'border border-white/20 px-3 py-3 md:px-4 md:py-4 hover:border-white/30 hover:bg-white/5',
        props.loading ? 'opacity-60 cursor-not-allowed' : ''
      ]"
      @click="toggleDropdown"
    >
      <svg
        v-if="props.loading"
        class="w-4 h-4 md:w-5.5 md:h-5.5 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <template v-else-if="props.variant === 'consult'">
        <svg class="w-4 h-4 md:w-5.5 md:h-5.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" stroke-width="1.2" />
          <path
            d="M1.5 12.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </svg>
        CONSULT STYLIST
      </template>
      <template v-else>
        <svg
          class="w-4 h-4 md:w-5.5 md:h-5.5"
          viewBox="0 0 12 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1h10v14L6 11 1 15V1z"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
        ADD TO MOODBOARD
      </template>
    </button>

    <div
      v-if="isOpen && props.variant === 'bookmark'"
      class="absolute left-0 top-full z-10 mt-2 min-w-full overflow-hidden rounded-xl border border-white/20 bg-elevated/90 shadow-lg backdrop-blur-md"
    >
      <button
        type="button"
        class="w-full px-5 py-4 text-left font-mono text-sm uppercase tracking-widest text-text-secondary transition-colors duration-150 hover:bg-white/8 hover:text-text-primary"
        @click="
          emit('create-folder');
          isOpen = false;
        "
      >
        新建資料夾
      </button>
      <div class="mx-4 h-px bg-white/10" />
      <button
        type="button"
        class="w-full px-5 py-4 text-left font-mono text-sm uppercase tracking-widest text-text-secondary transition-colors duration-150 hover:bg-white/8 hover:text-text-primary"
        @click="
          emit('save-to-folder');
          isOpen = false;
        "
      >
        儲存到既有資料夾
      </button>
    </div>
    <p v-if="props.error" class="mt-2 text-center font-mono text-xs text-red-400">
      {{ props.error }}
    </p>
  </div>
</template>
