<script setup lang="ts">
withDefaults(
  defineProps<{
    connector?: boolean;
    connectorAlign?: 'center' | 'first-item';
    maxVisibleItems?: number;
    surface?: 'void' | 'panel';
  }>(),
  { connector: false, connectorAlign: 'center', maxVisibleItems: undefined, surface: 'void' }
);

const dividerStyles =
  '[&_[data-bracket-dropdown-divider]]:mx-auto [&_[data-bracket-dropdown-divider]]:block [&_[data-bracket-dropdown-divider]]:h-px [&_[data-bracket-dropdown-divider]]:w-[calc(100%_-_32px)] [&_[data-bracket-dropdown-divider]]:bg-white/70';

const itemStyles =
  '[&_[data-bracket-dropdown-item]]:flex [&_[data-bracket-dropdown-item]]:min-h-12 [&_[data-bracket-dropdown-item]]:w-full [&_[data-bracket-dropdown-item]]:cursor-pointer [&_[data-bracket-dropdown-item]]:items-center [&_[data-bracket-dropdown-item]]:justify-center [&_[data-bracket-dropdown-item]]:px-4 [&_[data-bracket-dropdown-item]]:py-3 [&_[data-bracket-dropdown-item]]:text-center [&_[data-bracket-dropdown-item]]:transition-colors [&_[data-bracket-dropdown-item]]:duration-200 [&_[data-bracket-dropdown-item]]:hover:bg-white/5 [&_[data-bracket-dropdown-item][data-leading-icon]]:justify-start [&_[data-bracket-dropdown-item][data-leading-icon]]:pl-8 md:[&_[data-bracket-dropdown-item][data-leading-icon]]:pl-4 [&_[data-bracket-dropdown-item]:disabled]:cursor-not-allowed [&_[data-bracket-dropdown-item]:disabled]:opacity-50';
</script>

<template>
  <div
    class="w-40 font-title text-xs font-normal normal-case tracking-normal text-text-primary"
  >
    <span
      v-if="connector"
      aria-hidden="true"
      class="pointer-events-none absolute right-full hidden h-px w-10 -translate-y-1/2 bg-white/60 md:block"
      :class="connectorAlign === 'first-item' ? 'top-6' : 'top-1/2'"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 inset-y-px"
      :class="surface === 'panel' ? 'bg-[#252525]' : 'bg-void'"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 left-0 w-2.5 border-y border-l border-white/80"
    />
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-y-0 right-0 w-2.5 border-y border-r border-white/80"
    />

    <div
      class="relative"
      :class="
        maxVisibleItems
          ? 'overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : ''
      "
      :style="
        maxVisibleItems
          ? { maxHeight: `calc(${maxVisibleItems * 3}rem + ${maxVisibleItems - 1}px)` }
          : undefined
      "
    >
      <div :class="[dividerStyles, itemStyles]">
        <slot />
      </div>
    </div>
  </div>
</template>
