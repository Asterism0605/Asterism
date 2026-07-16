<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStyleTagLabel } from '@/composables/useStyleTagLabel';
import { STYLE_TAG_DESCRIPTIONS } from '@/data/styleTagDescriptions';
import { useStyleTagModalStore } from '@/stores/styleTagModal.store';

const props = defineProps<{
  modelValue: boolean;
  tagLabel: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t, locale } = useI18n();
const { displayLabel } = useStyleTagLabel();
const styleTagModalStore = useStyleTagModalStore();

const description = computed(() => {
  if (!props.tagLabel) return null;
  return STYLE_TAG_DESCRIPTIONS[props.tagLabel] ?? null;
});

const isOpen = computed(
  () => props.modelValue && props.tagLabel !== null && description.value !== null
);

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
    styleTagModalStore.setOpen(open);

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
  styleTagModalStore.setOpen(false);

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
          <div class="tag-modal-label-connector" aria-hidden="true">
            <span class="tag-modal-label-line" />
            <span class="tag-modal-label-tail" />
          </div>

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
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: #000;
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
  left: -10%;
  top: 10%;
  margin: 0;
  transform: translateY(-100%);
  color: rgba(240, 237, 230, 0.92);
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.tag-modal-label-connector {
  position: absolute;
  left: -10%;
  top: 0%;
  display: flex;
  align-items: flex-start;
  width: 200px;
}

.tag-modal-label-line {
  height: 2px;
  flex: 1;
  background: rgba(240, 237, 230, 0.8);
}

.tag-modal-label-tail {
  position: relative;
  display: block;
  width: 36px;
  height: 1px;
  margin-top: 1px;
  margin-left: -1px;
  background: rgba(240, 237, 230, 0.8);
  transform: rotate(42deg);
  transform-origin: left center;
}

.tag-modal-label-tail::after {
  content: '';
  position: absolute;
  right: -46px;
  top: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transform: rotate(-42deg);
}

.tag-modal-close {
  position: absolute;
  top: 20%;
  right: 20%;
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
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: 55%;
  margin: 0;
  color: rgba(240, 237, 230, 0.7);
  font-size: 16px;
  line-height: 1.6;
  text-align: center;
}
/* 斷點從 640px 拉到 900px：iPad mini(768)/Air(820)/Pro 11吋(834) portrait
   寬度超過 640，原本會掉回「電腦版」CSS（label 用 left:-10% 掛在框外），
   寬度不夠，label 側邊那條裝飾線一樣會被裁到畫面外——跟手機版最早修的那個
   bug 是同一種（實測 834 寬度連線都還會裁到）。900 這個斷點在真正桌機
   寬度(1280+)跟大尺寸 iPad Pro 12.9 吋(1024) 都不受影響——電腦版橢圓框本來
   就用 min(85vw,820px) 封頂，寬度超過 ~964px 後畫面就跟寬度無關、恆定
   不變，900 這個斷點還在安全範圍內，不會不小心把真桌機也吃進手機版設計。 */
@media (max-width: 900px) {
  .tag-modal-backdrop {
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0;
  }
  .tag-modal-ellipse {
    position: fixed;
    left: -9vw;
    top: calc(64vh - 87vw);
    width: 174vw;
    height: 174vw;
    border-radius: 50%;
  }

  .tag-modal-label-connector {
    position: fixed;
    left: 16vw;
    top: calc(64vh - 44.47vw);
    width: 56vw;
    height: auto;
    align-items: flex-start;
    flex-direction: row-reverse;
  }

  .tag-modal-label {
    position: fixed;
    left: 44vw;
    top: calc(64vh - 53.36vw);
    max-width: 58vw;
    font-size: 20px;
    white-space: normal;
    transform: none;
  }

  /* 極端長寬比（如 Surface Duo 540x720，接近正方形）算出來的 top 會小到
     讓 CLOSE 整個縮進 AppHeader（65px 高）底下、被蓋住。用 max() 保底，
     不管 calc() 算出多小，CLOSE 永遠留在 header 下緣 + 1rem 的位置。 */
  .tag-modal-close {
    position: fixed;
    top: max(calc(64vh - 78.26vw), calc(65px + 1rem));
    right: 6vw;
  }

  .tag-modal-description {
    position: fixed;
    left: 30vw;
    top: calc(64vh - 24.9vw);
    max-width: 60vw;
    font-size: 14px;
    text-align: left;
    transform: none;
  }
  /* width/left/top 改用 vw（原本是寫死的 px）：斜線長度、白點偏移量都要跟著
     圓弧的半徑（87vw）一起縮放，不然固定像素在不同手機的半徑下佔比不同，
     會有「差一點點」的殘留誤差（iPhone SE 調好、XR/14 Pro Max/Pixel 7/
     Galaxy S20 Ultra 卻都差一點點，根因就是這裡)。數字是拿 iPhone SE
     （寬 375）量出來的像素反推：46px→12.27vw、-38px→-10.13vw、
     -7px→-1.87vw、18px→4.8vw。 */
  .tag-modal-label-tail {
    margin-right: -1px;
    transform-origin: right center;
    width: 12.27vw;
  }

  .tag-modal-label-tail::after {
    left: -10.13vw;
    top: -1.87vw;
    width: 4.8vw;
    height: 4.8vw;
  }
}
</style>
