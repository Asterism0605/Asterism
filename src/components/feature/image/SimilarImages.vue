<script setup lang="ts">
defineProps<{
  images: string[];
}>();
</script>

<template>
  <div>
    <h2 class="text-h3 text-text-primary mb-2">Similar</h2>

    <div v-if="images.length" class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      <img
        v-for="(img, i) in images.slice(0, 4)"
        :key="i"
        :src="img"
        alt=""
        class="aspect-square w-full rounded object-cover"
      />
    </div>
  </div>
</template>
