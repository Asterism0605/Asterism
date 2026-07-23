<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import type { MoodboardStatus } from '@/types/moodboard';

/**
 * 情緒板狀態顯示元件
 *
 * 根據 moodboard store 的狀態顯示對應的 UI：
 * - loading：顯示載入中提示
 * - error：顯示錯誤訊息與重試按鈕
 *
 * @prop {MoodboardStatus} status - 當前狀態
 * @emit retry - 使用者點擊「再試一次」按鈕
 */
defineProps<{
  status: MoodboardStatus;
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div
    v-if="status === 'loading'"
    data-testid="moodboard-loading"
    class="flex h-full items-center justify-center text-sm text-white/60"
  >
    {{ $t('moodboard.loading') }}
  </div>
  <div
    v-else-if="status === 'error'"
    data-testid="moodboard-error"
    class="flex h-full flex-col items-center justify-center gap-4 text-center text-white"
  >
    <p>{{ $t('moodboard.loadError') }}</p>
    <Button variant="secondary" @click="$emit('retry')">
      {{ $t('moodboard.retry') }}
    </Button>
  </div>
</template>
