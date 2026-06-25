<script setup lang="ts">
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';

interface Props {
  mainImageUrl: string;
  smallImages: string[];
}

defineProps<Props>();
</script>

<template>
  <div class="relative w-3/5 overflow-hidden bg-void">
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
      />

      <img
        v-if="smallImages[0]"
        :src="smallImages[0]"
        alt=""
        class="float-img absolute left-[6%] top-[10%] w-[14%] rounded-[4px] object-contain opacity-40"
        style="--float-delay: 0.5s"
      />

      <img
        v-if="smallImages[1]"
        :src="smallImages[1]"
        alt=""
        class="float-img absolute bottom-[6%] right-[6%] w-[14%] rounded-[4px] object-contain opacity-40"
        style="--float-delay: 0.5s"
      />
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
