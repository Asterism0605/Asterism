<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStyleTagLabel } from '@/composables/useStyleTagLabel';
import { STYLE_TAG_DESCRIPTIONS } from '@/data/styleTagDescriptions';

const props = defineProps<{
  modelValue: boolean;
  tagLabel: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t, locale } = useI18n();
const { displayLabel } = useStyleTagLabel();

const description = computed(() => {
  if (!props.tagLabel) return null;
  return STYLE_TAG_DESCRIPTIONS[props.tagLabel] ?? null;
});

const isOpen = computed(() => props.modelValue && props.tagLabel !== null && description.value !== null);

const descriptionText = computed(() =>
  description.value ? (locale.value === 'zh' ? description.value.zh : description.value.en) : ''
);

const panelRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);
let previousBodyOverflow = '';

function closeModal() {
  emit('update:modelValue', false);
}

function handleBackdropClick() {
  closeModal();
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }

  const panelElement = panelRef.value;

  if (event.key !== 'Tab' || !panelElement) {
    return;
  }

  const focusableElements = panelElement.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if (!focusableElements.length) {
    event.preventDefault();
    panelElement.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

async function focusPanel() {
  await nextTick();
  panelRef.value?.focus();
}

watch(
  isOpen,
  (open) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (open) {
      previousActiveElement.value = document.activeElement as HTMLElement | null;
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeydown);
      void focusPanel();
      return;
    }

    document.body.style.overflow = previousBodyOverflow;
    window.removeEventListener('keydown', handleKeydown);
    previousActiveElement.value?.focus();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="isOpen"
        class="tag-modal-backdrop"
        role="presentation"
        @click.self="handleBackdropClick"
      >
        <section
          ref="panelRef"
          class="tag-modal-ellipse"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          :aria-labelledby="tagLabel ? 'tag-modal-label' : undefined"
          :aria-describedby="tagLabel ? 'tag-modal-description' : undefined"
          @click.stop
        >
          <p id="tag-modal-label" class="tag-modal-label">
            {{ tagLabel ? displayLabel(tagLabel) : '' }}
          </p>
          <span class="tag-modal-label-line" aria-hidden="true" />
          <span class="tag-modal-label-dot" aria-hidden="true" />

          <button class="tag-modal-close" type="button" @click="closeModal">
            {{ t('dna.close') }}
            <span aria-hidden="true">↗</span>
          </button>

          <p id="tag-modal-description" class="tag-modal-description">
            {{ descriptionText }}
          </p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tag-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: rgba(0, 0, 0, 0.72);
}

.tag-modal-ellipse {
  position: relative;
  width: min(85vw, 820px);
  height: min(55vw, 420px);
  border: 1px solid rgba(240, 237, 230, 0.5);
  border-radius: 50%;
  outline: none;
}

.tag-modal-label {
  position: absolute;
  left: 4%;
  top: 20%;
  margin: 0;
  transform: translateY(-100%);
  color: rgba(240, 237, 230, 0.92);
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.tag-modal-label-line {
  position: absolute;
  left: 4%;
  top: 20%;
  width: 160px;
  height: 1px;
  margin-top: 8px;
  background: rgba(240, 237, 230, 0.8);
}

.tag-modal-label-dot {
  position: absolute;
  left: calc(4% + 160px);
  top: calc(20% + 8px);
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(240, 237, 230, 0.92);
}

.tag-modal-close {
  position: absolute;
  top: 16%;
  right: 10%;
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f0ede6d1;
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 180ms ease;
}

.tag-modal-close:is(:hover, :focus-visible) {
  filter: drop-shadow(0 0 7px #f0ede657);
}

.tag-modal-close span {
  margin-left: 4px;
}

.tag-modal-description {
  position: absolute;
  left: 8%;
  bottom: 20%;
  max-width: 55%;
  margin: 0;
  color: rgba(240, 237, 230, 0.7);
  font-size: 16px;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .tag-modal-ellipse {
    width: 92vw;
    height: 78vw;
  }

  .tag-modal-label {
    font-size: 16px;
  }

  .tag-modal-label-line {
    width: 96px;
  }

  .tag-modal-label-dot {
    left: calc(4% + 96px);
  }

  .tag-modal-description {
    max-width: 70%;
    font-size: 14px;
  }

  .tag-modal-close {
    top: 10%;
    right: 8%;
  }
}
</style>
