<script setup lang="ts">
import { computed } from 'vue'
import { hideToast, useToast } from '@/composables/useToast'

const { toast } = useToast()

const toneClasses = computed(() => {
  switch (toast.value?.type) {
    case 'success':
      return 'border-emerald-300/30 bg-emerald-200/10'
    case 'warning':
      return 'border-amber-300/30 bg-amber-200/10'
    case 'error':
      return 'border-rose-300/30 bg-rose-200/10'
    default:
      return 'border-white/15 bg-white/[0.06]'
  }
})

function handleAction() {
  toast.value?.onAction?.()
  hideToast()
}
</script>

<template>
  <div
    v-if="toast"
    class="pointer-events-none fixed inset-x-4 bottom-4 z-[120] flex justify-center sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-auto"
    data-testid="app-toast"
  >
    <div
      class="pointer-events-auto flex w-full max-w-md items-start gap-4 rounded-2xl border px-4 py-4 text-text-primary shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      :class="toneClasses"
    >
      <div class="min-w-0 flex-1">
        <p class="text-sm leading-6 text-text-primary">
          {{ toast.message }}
        </p>
        <button
          v-if="toast.actionText"
          type="button"
          class="mt-3 text-sm font-semibold text-gold-dim transition-opacity hover:opacity-80"
          data-testid="toast-action"
          @click="handleAction"
        >
          {{ toast.actionText }}
        </button>
      </div>

      <button
        type="button"
        class="rounded-full border border-white/10 px-2 py-1 text-xs text-text-secondary transition-colors hover:border-white/20 hover:text-text-primary"
        data-testid="toast-dismiss"
        @click="hideToast"
      >
        Close
      </button>
    </div>
  </div>
</template>
