<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Bookmark, LoaderCircle, User } from '@lucide/vue';
import Button from '@/components/ui/Button.vue';

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
    <Button
      v-if="props.loading"
      variant="primary"
      disabled
      class="w-full !px-3 !py-3 md:!px-4 md:!py-4 opacity-60 cursor-not-allowed"
    >
      <LoaderCircle class="w-4 h-4 md:w-5.5 md:h-5.5 animate-spin" aria-hidden="true" />
    </Button>
    <Button
      v-else-if="props.variant === 'consult'"
      variant="primary"
      class="w-full !px-3 !py-3 md:!px-4 md:!py-4"
    >
      <span class="flex items-center justify-center gap-1 md:gap-2 font-mono text-xs md:text-sm uppercase tracking-widest">
        <User class="w-4 h-4 md:w-5.5 md:h-5.5" aria-hidden="true" />
        CONSULT STYLIST
      </span>
    </Button>
    <template v-else>
      <Button
        variant="secondary"
        class="w-full !px-3 !py-3 md:!px-4 md:!py-4"
        @click="toggleDropdown"
      >
        <span class="flex items-center justify-center gap-1 md:gap-2 font-mono text-xs md:text-sm uppercase tracking-widest">
          <Bookmark class="w-4 h-4 md:w-5.5 md:h-5.5" aria-hidden="true" />
          ADD TO MOODBOARD
        </span>
      </Button>
    </template>

    <div
      v-if="isOpen && props.variant === 'bookmark'"
      class="absolute left-0 top-full z-10 mt-2 min-w-full overflow-hidden rounded-xl border border-white/20 bg-elevated/90 shadow-lg backdrop-blur-md"
    >
      <button
        type="button"
        class="w-full px-4 sm:px-5 py-1.5 sm:py-2 text-left font-mono text-sm uppercase tracking-widest text-text-secondary transition-colors duration-150 hover:bg-white/8 hover:text-text-primary"
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
        class="w-full px-4 sm:px-5 py-1.5 sm:py-2 text-left font-mono text-sm uppercase tracking-widest text-text-secondary transition-colors duration-150 hover:bg-white/8 hover:text-text-primary"
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
