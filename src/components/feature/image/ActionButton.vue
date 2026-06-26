<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Bookmark, BookmarkPlus, FolderPlus, LoaderCircle, User } from '@lucide/vue';
import Button from '@/components/ui/Button.vue';

interface Props {
  variant?: 'bookmark' | 'consult';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'bookmark',
  loading: false
});

const emit = defineEmits<{
  consult: [];
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
      class="w-full !px-3 !py-3 md:!px-4 md:!py-4 cursor-not-allowed"
    >
      <LoaderCircle class="w-4 h-4 md:w-5.5 md:h-5.5 animate-spin" aria-hidden="true" />
    </Button>
    <Button
      v-else-if="props.variant === 'consult'"
      variant="primary"
      class="w-full !px-3 !py-3 md:!px-4 md:!py-4"
      @click="emit('consult')"
    >
      <span class="flex items-center justify-center gap-1 md:gap-2 font-mono text-xs md:text-sm uppercase tracking-widest">
        <User class="w-4 h-4 md:w-5.5 md:h-5.5" aria-hidden="true" />
        CONSULT STYLIST
      </span>
    </Button>
    <template v-else>
      <Button
        variant="secondary"
        class="w-full !px-3 !py-3 md:!px-4 md:!py-4 bg-black hover:!bg-[#111111]"
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
      class="absolute left-0 top-full z-10 mt-2 min-w-full overflow-hidden rounded-xl border border-white/20 bg-dropdown/95 shadow-lg backdrop-blur-md"
    >
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-text-primary transition-all duration-200 hover:bg-white/5 md:justify-start md:px-4 md:py-4 md:text-sm"
        @click="
          emit('create-folder');
          isOpen = false;
        "
      >
        <FolderPlus class="h-4 w-4 shrink-0 md:ml-[22px]" aria-hidden="true" />
        <span class="w-28 text-center md:w-auto md:text-left">CREATE NEW FOLDER</span>
      </button>
      <div class="mx-4 h-px bg-white/10" />
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-text-primary transition-all duration-200 hover:bg-white/5 md:justify-start md:px-4 md:py-4 md:text-sm"
        @click="
          emit('save-to-folder');
          isOpen = false;
        "
      >
        <BookmarkPlus class="h-4 w-4 shrink-0 md:ml-[22px]" aria-hidden="true" />
        <span class="w-28 text-center md:w-auto md:text-left">SAVE TO FOLDER</span>
      </button>
    </div>
  </div>
</template>
