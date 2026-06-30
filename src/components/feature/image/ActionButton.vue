<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Bookmark, BookmarkPlus, ChevronDown, FolderPlus, User } from '@lucide/vue';
import Button from '@/components/ui/Button.vue';

interface FolderItem {
  id: string;
  name: string;
}

interface Props {
  variant?: 'bookmark' | 'consult';
  saved?: boolean;
  disabled?: boolean;
  spread?: boolean;
  folders?: FolderItem[];
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'bookmark',
  folders: () => []
});

const emit = defineEmits<{
  consult: [];
  'create-folder': [];
  'save-to-folder': [folderId: string];
}>();

const isOpen = ref(false);
const showFolderList = ref(false);
const savedFolderId = ref<string | null>(null);
const containerRef = ref<HTMLElement | null>(null);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
  showFolderList.value = false;
}

function handleOutsideClick(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
    showFolderList.value = false;
  }
}

function handleSaveToFolderClick(folder: FolderItem) {
  savedFolderId.value = folder.id;
  emit('save-to-folder', folder.id);
  setTimeout(() => {
    savedFolderId.value = null;
    isOpen.value = false;
    showFolderList.value = false;
  }, 800);
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
      v-if="props.variant === 'consult'"
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
        class="w-full !px-3 !py-3 md:!px-4 md:!py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="props.spread ? 'bg-black hover:!bg-dropdown' : ''"
        :disabled="props.disabled"
        @click="toggleDropdown()"
      >
        <span class="flex items-center justify-center gap-1 md:gap-2 font-mono text-xs md:text-sm uppercase tracking-widest">
          <Bookmark class="w-4 h-4 md:w-5.5 md:h-5.5" :fill="props.saved ? 'currentColor' : 'none'" aria-hidden="true" />
          ADD TO MOODBOARD
        </span>
      </Button>
    </template>

    <div
      v-if="isOpen && props.variant === 'bookmark'"
      class="absolute left-0 top-full z-10 mt-2 min-w-full overflow-visible rounded-xl border border-white/20 bg-dropdown/95 shadow-lg backdrop-blur-md"
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

      <template v-if="props.folders.length > 0">
        <div class="mx-4 h-px bg-white/10" />
        <div class="relative">
          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-text-primary transition-all duration-200 hover:bg-white/5 md:justify-start md:px-4 md:py-4 md:text-sm"
            @click.stop="showFolderList = !showFolderList"
          >
            <BookmarkPlus class="h-4 w-4 shrink-0 md:ml-[22px]" aria-hidden="true" />
            <span class="w-28 text-center md:w-auto md:text-left">SAVE TO FOLDER</span>
            <ChevronDown class="ml-auto h-3 w-3 shrink-0" aria-hidden="true" />
          </button>

          <div
            v-if="showFolderList"
            class="absolute left-0 top-full z-20 mt-2 w-[calc(100%-8px)] overflow-hidden rounded-xl border border-white/20 bg-dropdown/95 shadow-lg backdrop-blur-md"
          >
            <button
              v-for="folder in props.folders"
              :key="folder.id"
              type="button"
              class="flex w-full items-center justify-center gap-2 px-3 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-text-primary transition-all duration-200 hover:bg-white/5 md:justify-start md:px-4 md:py-4 md:text-sm"
              @click.stop="handleSaveToFolderClick(folder)"
            >
              <BookmarkPlus class="h-4 w-4 shrink-0 md:ml-[22px]" aria-hidden="true" />
              <span class="flex-1 min-w-0 break-words text-center md:text-left">
                {{ savedFolderId === folder.id ? '✓ Saved' : folder.name }}
              </span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
