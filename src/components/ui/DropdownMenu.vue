<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    panelClass?: string;
    panelTestId?: string;
    role?: string;
  }>(),
  { panelClass: '', panelTestId: undefined, role: undefined }
);
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0 translate-y-1 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-1 scale-95"
  >
    <div
      v-if="open"
      :data-testid="panelTestId"
      :role="role"
      class="absolute right-0 top-[calc(100%+10px)] z-20 origin-top-right rounded-2xl border border-white/8 bg-elevated/90 backdrop-blur-xl shadow-2xl overflow-hidden"
      :class="panelClass"
    >
      <slot />
    </div>
  </Transition>
</template>
