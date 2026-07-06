<script setup lang="ts">
import type { ImageSpreadNode } from '@/types/image';

defineProps<{
  images: ImageSpreadNode[];
}>();

const emit = defineEmits<{
  select: [imageId: string];
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-h3 text-text-primary">{{ $t('image.similar') }}</h2>

    <div v-if="images.length" class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <button
        v-for="image in images.slice(0, 4)"
        :key="image.id"
        type="button"
        class="cursor-pointer overflow-hidden rounded text-left transition duration-200 hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-dim"
        @click="emit('select', image.id)"
      >
        <img :src="image.src" :alt="image.alt" class="aspect-square w-full object-cover" />
      </button>
    </div>
  </div>
</template>
