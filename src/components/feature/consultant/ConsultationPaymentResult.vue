<script setup lang="ts">
import Button from '@/components/ui/Button.vue';

defineProps<{
  title: string;
  description: string;
}>();

const emit = defineEmits<{
  restart: [];
}>();
</script>

<template>
  <section class="consultation-payment-result" role="status">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <Button type="button" variant="secondary" @click="emit('restart')">
      {{ $t('consult.bookAgain') }}
    </Button>
  </section>
</template>

<style scoped>
.consultation-payment-result {
  display: grid;
  gap: 14px;
  padding: clamp(24px, 5vw, 46px);
  border: 1px solid #a8893a66;
  border-radius: 8px;
  background: #ffffff0e;
  box-shadow: 0 24px 80px #00000057;
  backdrop-filter: blur(18px);
}

.consultation-payment-result h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.consultation-payment-result p {
  color: #f0ede6b8;
  line-height: 1.6;
}

.consultation-payment-result :deep(button) {
  justify-self: start;
}
</style>
