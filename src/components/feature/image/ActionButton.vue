<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  Bookmark,
  BookmarkPlus,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  LoaderCircle,
  User
} from '@lucide/vue';
import Button from '@/components/ui/Button.vue';

interface FolderItem {
  id: string;
  name: string;
  saved?: boolean;
}

interface Props {
  variant?: 'bookmark' | 'consult';
  saved?: boolean;
  disabled?: boolean;
  spread?: boolean;
  folders?: FolderItem[];
  justSavedFolderId?: string | null;
  canSave?: boolean;
  openRequest?: number;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'bookmark',
  folders: () => [],
  justSavedFolderId: null,
  canSave: false,
  openRequest: 0
});

const emit = defineEmits<{
  consult: [];
  'auth-required': [];
  'create-folder': [];
  'save-to-folder': [folderId: string];
}>();

const isOpen = ref(false);
const showFolderList = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const isBusy = computed(() => props.disabled || props.justSavedFolderId !== null);

function toggleDropdown() {
  if (!props.canSave) {
    emit('auth-required');
    return;
  }

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
  if (isBusy.value) return;
  emit('save-to-folder', folder.id);
}

watch(
  () => props.openRequest,
  (current) => {
    if (current > 0 && props.canSave) isOpen.value = true;
  },
  { immediate: true }
);

watch(
  () => props.justSavedFolderId,
  (current, previous) => {
    if (previous && !current) {
      isOpen.value = false;
      showFolderList.value = false;
    }
  }
);

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
      <span
        class="flex items-center justify-center gap-1 md:gap-2 font-mono text-xs md:text-sm uppercase tracking-widest"
      >
        <User class="w-4 h-4 md:w-5.5 md:h-5.5" aria-hidden="true" />
        {{ $t('image.consultStylist') }}
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
        <span
          class="flex items-center justify-center gap-1 md:gap-2 font-mono text-xs md:text-sm uppercase tracking-widest"
        >
          <LoaderCircle
            v-if="props.disabled"
            class="w-4 h-4 md:w-5.5 md:h-5.5 animate-spin"
            aria-hidden="true"
          />
          <Bookmark
            v-else
            class="w-4 h-4 md:w-5.5 md:h-5.5"
            :fill="props.saved ? 'currentColor' : 'none'"
            aria-hidden="true"
          />
          {{ $t('image.addToMoodboard') }}
        </span>
      </Button>
    </template>

    <div
      v-if="isOpen && props.variant === 'bookmark'"
      class="absolute z-10 w-40 overflow-visible rounded-xl border border-white/20 bg-dropdown/95 shadow-lg backdrop-blur-md"
      :class="
        props.spread
          ? props.folders.length === 0
            ? 'left-0 top-full mt-2 md:left-full md:top-0 md:mt-0 md:ml-2'
            : 'left-0 top-full mt-2 md:left-full md:top-[-50px] md:mt-0 md:ml-2'
          : 'left-0 top-full mt-2'
      "
    >
      <button
        type="button"
        class="flex w-full cursor-pointer items-center justify-center gap-2 px-2 py-2 text-left font-mono text-xs font-semibold uppercase tracking-widest text-text-primary transition-all duration-200 hover:bg-white/5 md:justify-start md:px-3 md:py-2.5"
        @click="
          emit('create-folder');
          isOpen = false;
        "
      >
        <FolderPlus class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span class="flex-1 min-w-0 text-center md:text-left">{{
          $t('moodboard.createFolderTitle')
        }}</span>
      </button>

      <template v-if="props.folders.length > 0">
        <div class="mx-4 h-px bg-white/10" />
        <div class="relative">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-center gap-2 px-2 py-2 text-left font-mono text-xs font-semibold uppercase tracking-widest text-text-primary transition-all duration-200 hover:bg-white/5 md:justify-start md:px-3 md:py-2.5"
            @click.stop="showFolderList = !showFolderList"
          >
            <BookmarkPlus class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span class="flex-1 min-w-0 text-center md:text-left">SAVE TO FOLDER</span>
            <template v-if="props.spread">
              <ChevronDown class="ml-auto h-4 w-4 shrink-0 md:hidden" aria-hidden="true" />
              <ChevronRight class="ml-auto hidden h-4 w-4 shrink-0 md:block" aria-hidden="true" />
            </template>
            <ChevronDown v-else class="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
          </button>

          <div
            v-if="showFolderList"
            class="absolute z-20 w-40 overflow-hidden rounded-xl border border-white/20 bg-dropdown/95 shadow-lg backdrop-blur-md"
            :class="
              props.spread
                ? 'left-0 top-full mt-2 md:left-full md:top-0 md:mt-0 md:ml-2'
                : 'left-0 top-full mt-2'
            "
          >
            <button
              v-for="folder in props.folders"
              :key="folder.id"
              type="button"
              class="flex w-full cursor-pointer items-center justify-center gap-2 px-2 py-2 text-left font-mono text-xs font-semibold uppercase tracking-widest text-text-primary transition-all duration-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 md:justify-start md:px-3 md:py-2.5"
              :disabled="isBusy"
              @click.stop="handleSaveToFolderClick(folder)"
            >
              <Bookmark
                class="h-4 w-4 shrink-0"
                :fill="folder.saved ? 'currentColor' : 'none'"
                aria-hidden="true"
              />
              <span class="flex-1 min-w-0 truncate text-center md:text-left">
                {{ props.justSavedFolderId === folder.id ? '✓ Saved' : folder.name }}
              </span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
