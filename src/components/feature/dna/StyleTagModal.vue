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
  /* inset:0 蓋滿全螢幕（含 PictureDetail 頁面本身「← 返回」那類一般內容，
     它們沒有特別拉高 z-index，理應被 modal 蓋住）。AppHeader 改在自己身上
     拉高 z-index（見 AppHeader.vue 的 z-[110]）蓋過這裡的 z-index:100，
     不在這裡開洞——開洞會連 PictureDetail 同一列的「← 返回」也一併露出來，
     這正是 una-hsieh review 明確要求「header 只留 AppHeader 本身內容」的反例。 */
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

/* 手機版改走 una-hsieh review 提供的設計參考（大圓弧只露出左上一角，label／說明文字
   靠視窗定位，不再是桌機那種「小橢圓框 + 內容相對橢圓框定位」）。窄螢幕下橢圓框若维持
   小尺寸、label 又用 left:-10% 掛在框外，會直接被裁到螢幕外（實測 iPhone 寬度 390px
   會裁掉 label 前緣）；改成不掛外側、內容改用 vw/vh 直接相對視窗定位就不會再裁切。

   跨機型對齊：iPhone 之間「高度」差很多（SE 667、XR/12/14Pro 844~896），但「寬度」
   差不多（375~414）。橢圓框的 top 本來就用 calc(64vh - 87vw) 混合寬高算，跟著螢幕
   寬度縮放；但 label/connector/close/description 原本用純 vh，只跟著高度縮放——
   兩種算法在 SE 上調好看之後，換到 XR/12/14Pro 這種高度差很大的機型，兩邊縮放幅度
   不同步，橢圓框跟著高度被推低很多、其餘元素卻沒跟著推那麼多，看起來就像「整組往上
   偏了」。修法：全部改用同一種 calc(64vh - Xvw) 算法（X 用當時在 iPhone SE 量出來的
   實際像素反推），全部錨定同一個基準（跟橢圓框中心同一條 64vh 基準線），才會不管換
   到哪個機型都維持同一套相對位置，不會再跑掉。 */
@media (max-width: 640px) {
  .tag-modal-backdrop {
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0;
  }

  /* 圓弧方向：用參考稿實際像素描點反推圓心/半徑（不是用眼睛量），取樣上下兩段
     可見弧線＋label 白點共 3 個點解圓方程式，圓心在（約 78vw, 64vh）、半徑約 87vw
     ——比先前那版（56vw/68vw）大上不少、圓心也更靠右，弧線才會貼著左緣一路
     豎直下滑到接近畫面底部，不是一開口就整個鼓出去。 */
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
    /* top 用跟橢圓框同一種 calc(64vh - Xvw) 算法（不是純 vh），理由見下方
       「跨機型對齊」說明。 */
    top: calc(64vh - 44.47vw);
    width: 56vw;
    height: auto;
    align-items: flex-start;
    /* row-reverse：讓對角線（.tag-modal-label-tail）排前面（視覺上在左上），
       水平線（.tag-modal-label-line）排後面（視覺上在對角線右下）。
       不改 template 的 DOM 順序（桌機版靠它排列，動了會連桌機一起翻過來），
       只用 flex 方向翻轉「手機版」的視覺順序。 */
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

  .tag-modal-close {
    position: fixed;
    top: calc(64vh - 78.26vw);
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

  /* 手機版專屬：對角線的支點方向。桌機版是「橫線先、對角線後」，支點在對角線
     自己的左端（transform-origin: left center）合理；但手機版用 row-reverse
     把對角線排到前面（視覺上在橫線左邊），對角線的「右端」才是接住橫線的那一頭，
     支點應該改成右邊，橫線那頭才會固定不動、只有另一端擺動——這是跟
     StyleAnnotationDisplay.vue（太空人標籤，Vintage/Retro 那種靠右樣式）
     抄來的同一招（origin-right + margin-right:-1px），不用再用誇張的
     margin-top 硬凹角度。 */
  .tag-modal-label-tail {
    margin-right: -1px;
    transform-origin: right center;
    width: 46px; /* 數字越大線越長，支點在右邊，變長只會讓左邊那頭往外延伸 */
  }

  .tag-modal-label-tail::after {
    left: -38px;
    top: -7px;
    width: 18px;
    height: 18px;
  }
}
</style>
