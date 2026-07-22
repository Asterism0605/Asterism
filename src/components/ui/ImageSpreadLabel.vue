<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: 'span' | 'figcaption';
    size?: 'default' | 'large';
  }>(),
  { as: 'span', size: 'default' }
);
</script>

<template>
  <component
    :is="as"
    class="absolute bottom-[5px] left-[5px] z-10 inline-grid max-w-[calc(100%-24px)] items-end justify-items-start rounded-[1px_9px_1px_1px] bg-black/90 pt-[9px] pb-[3px] pl-[7px] pr-9 text-text-primary"
    :class="{ 'origin-bottom-left scale-[1.3]': size === 'large' }"
  >
    <span
      class="min-w-0 max-w-full font-title text-[11px] font-normal leading-[1.2] lowercase tracking-normal lg:leading-normal [[lang=zh-Hant]_&]:text-[10px]"
    >
      <slot />
    </span>
  </component>
</template>
