<script setup lang="ts">
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import type { ImageSpreadNode } from '@/types/image';

interface Props {
  mainImageUrl: string;
  smallImages: ImageSpreadNode[];
}

defineProps<Props>();

const emit = defineEmits<{
  select: [imageId: string];
  back: [];
}>();
</script>

<template>
  <!-- 點圖片以外的空白區（背景/星座線）＝返回，等同右側「返回」按鈕 -->
  <div class="relative w-3/5 overflow-hidden bg-void" @click="emit('back')">
    <div class="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      <ConstellationBackground
        :size="820"
        :node-size="12"
        :center-size="10"
        :spacing="120"
        :line-length="490"
        :line-width="3.5"
        :line-opacity="2"
        :active-node-opacity="0.85"
        :inactive-node-opacity="0.2"
        :intensity="0.5"
      />
    </div>

    <div class="absolute inset-0 z-10 flex items-center justify-center">
      <img
        :src="mainImageUrl"
        alt=""
        class="float-img max-h-[52vh] max-w-[55%] rounded-[4px] object-contain drop-shadow-2xl"
        style="--float-delay: 0s"
        @click.stop
      />

      <button
        v-if="smallImages[0]"
        type="button"
        class="float-img absolute left-[6%] top-[10%] w-[14%] cursor-pointer overflow-hidden rounded-[4px] opacity-40 transition-opacity duration-200 hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim"
        style="--float-delay: 0.5s"
        @click.stop="emit('select', smallImages[0].id)"
      >
        <img :src="smallImages[0].src" :alt="smallImages[0].alt" class="w-full object-contain" />
      </button>

      <button
        v-if="smallImages[1]"
        type="button"
        class="float-img absolute bottom-[6%] right-[6%] w-[14%] cursor-pointer overflow-hidden rounded-[4px] opacity-40 transition-opacity duration-200 hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim"
        style="--float-delay: 0.5s"
        @click.stop="emit('select', smallImages[1].id)"
      >
        <img :src="smallImages[1].src" :alt="smallImages[1].alt" class="w-full object-contain" />
      </button>
    </div>
  </div>
</template>

<style scoped>
:deep(.constellation-background) {
  opacity: 1;
  transition: none;
}
:deep(.constellation-background__canvas) {
  transform: scale(1);
  transition: none;
  border-radius: 50%;
}

@keyframes floatY {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

.float-img {
  animation: floatY 4s ease-in-out infinite;
  animation-delay: var(--float-delay, 0s);
}
</style>
