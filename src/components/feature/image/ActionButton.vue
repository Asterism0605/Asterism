<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  Bookmark,
  LoaderCircle,
  User
} from '@lucide/vue';
import ScrambleText from '@/components/effects/ScrambleText.vue';
import BracketDropdown from '@/components/ui/BracketDropdown.vue';
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
  opened: [];
  'create-folder': [];
  'save-to-folder': [folderId: string];
}>();

const isOpen = ref(false);
const showFolderList = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const moodboardScramble = ref<InstanceType<typeof ScrambleText> | null>(null);

const isBusy = computed(() => props.disabled || props.justSavedFolderId !== null);

function toggleDropdown() {
  if (!props.canSave) {
    emit('auth-required');
    return;
  }

  isOpen.value = !isOpen.value;
  showFolderList.value = false;
  if (isOpen.value) emit('opened');
}

function playMoodboardScramble() {
  if (props.spread) moodboardScramble.value?.play();
}

function playMoodboardScrambleOnFocus(event: FocusEvent) {
  if ((event.currentTarget as HTMLElement).matches(':focus-visible')) {
    playMoodboardScramble();
  }
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
        :variant="props.spread ? 'bracket' : 'secondary'"
        class="w-full disabled:cursor-not-allowed disabled:opacity-50"
        :class="props.spread ? 'h-10! px-4! py-0!' : 'px-3! py-3! md:px-4! md:py-4!'"
        :disabled="props.disabled"
        @mouseenter="playMoodboardScramble"
        @focus="playMoodboardScrambleOnFocus"
        @click="toggleDropdown()"
      >
        <span
          class="flex items-center justify-center gap-1 md:gap-2"
          :class="
            props.spread
              ? 'font-title text-sm font-medium tracking-normal'
              : 'font-mono text-xs uppercase tracking-widest md:text-sm'
          "
        >
          <LoaderCircle
            v-if="props.disabled"
            class="w-4 h-4 md:w-5.5 md:h-5.5 animate-spin"
            aria-hidden="true"
          />
          <Bookmark
            v-else
            class="w-4 h-4 md:w-4 md:h-4"
            :class="props.spread ? 'relative -top-[2px]' : ''"
            :stroke-width="1.5"
            :fill="props.saved ? 'currentColor' : 'none'"
            aria-hidden="true"
          />
          <span
            :class="
              props.spread
                ? 'relative inline-block border-b border-white/80 pb-1 leading-none'
                : ''
            "
          >
            <template v-if="props.spread">
              <span class="invisible" aria-hidden="true">{{
                $t('image.addToMoodboardSpread')
              }}</span>
              <ScrambleText
                ref="moodboardScramble"
                class="absolute inset-0 whitespace-nowrap"
                :text="$t('image.addToMoodboardSpread')"
                chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz "
                :duration="0.7"
                :speed="0.18"
                :autoplay="false"
              />
            </template>
            <template v-else>{{ $t('image.addToMoodboard') }}</template>
          </span>
        </span>
      </Button>
    </template>

    <BracketDropdown
      v-if="isOpen && props.variant === 'bookmark'"
      class="absolute z-10"
      :connector="props.spread"
      :class="
        props.spread
          ? 'left-0 top-full mt-[10px] w-full! md:left-full md:top-1/2 md:mt-0 md:ml-10 md:w-40! md:-translate-y-1/2'
          : 'left-0 top-full mt-2'
      "
    >
      <button
        type="button"
        data-bracket-dropdown-item
        @click="
          emit('create-folder');
          isOpen = false;
        "
      >
        {{ $t('image.createNewFolder') }}
      </button>

      <template v-if="props.folders.length > 0">
        <span data-bracket-dropdown-divider aria-hidden="true" />
        <div class="relative">
          <button
            type="button"
            data-bracket-dropdown-item
            @click.stop="showFolderList = !showFolderList"
          >
            {{ $t('image.saveToFolderMenu') }}
          </button>

          <BracketDropdown
            v-if="showFolderList"
            class="absolute z-20"
            :connector="props.spread"
            connector-align="first-item"
            :max-visible-items="5"
            :class="
              props.spread
                ? 'left-0 top-full mt-[10px] w-full! md:left-full md:top-0 md:mt-0 md:ml-10 md:w-max! md:min-w-40'
                : 'left-0 top-full mt-2'
            "
          >
            <template v-for="(folder, index) in props.folders" :key="folder.id">
              <span v-if="index > 0" data-bracket-dropdown-divider aria-hidden="true" />
              <button
                type="button"
                data-bracket-dropdown-item
                data-leading-icon
                :disabled="isBusy"
                :aria-pressed="folder.saved"
                @click.stop="handleSaveToFolderClick(folder)"
              >
                <Bookmark
                  class="mr-2 h-4 w-4 shrink-0"
                  :stroke-width="1.5"
                  :fill="folder.saved ? 'currentColor' : 'none'"
                  aria-hidden="true"
                />
                <span class="flex-none whitespace-nowrap text-left">
                  {{ props.justSavedFolderId === folder.id ? '✓ Saved' : folder.name }}
                </span>
              </button>
            </template>
          </BracketDropdown>
        </div>
      </template>
    </BracketDropdown>
  </div>
</template>
