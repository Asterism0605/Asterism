<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Button from '@/components/ui/Button.vue';

const emit = defineEmits<{
  action: [];
}>();

const { t } = useI18n();
</script>

<template>
  <section class="consultations-empty-state" role="status">
    <p>{{ t('accountConsultations.emptyDescription') }}</p>
    <Button type="button" variant="primary" @click="emit('action')">
      {{ t('accountConsultations.bookConsultation') }}
    </Button>
  </section>
</template>

<style scoped>
.consultations-empty-state {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 24px;
  color: #f0ede6b8;
  text-align: center;
}

.consultations-empty-state p {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

@media (max-width: 768px) {
  .consultations-empty-state {
    transform: translateY(-30px);
  }

  .consultations-empty-state p {
    font-size: 16px;
  }
}
</style>
