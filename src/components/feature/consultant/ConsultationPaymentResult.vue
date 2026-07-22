<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from '@/components/ui/Button.vue';

defineProps<{
  title: string;
  description: string;
  // 只有真的付款成功確認過,才讓使用者跳去「我的預約」看這筆——processing/failed
  // 這些中間狀態還沒有一筆確定存在的預約可看。
  showMyBookingsLink?: boolean;
}>();

const emit = defineEmits<{
  restart: [];
}>();

const router = useRouter();

function goToMyBookings(): void {
  void router.push('/account/consultations');
}
</script>

<template>
  <section class="consultation-payment-result" role="status">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <div class="consultation-payment-result__actions">
      <Button v-if="showMyBookingsLink" type="button" @click="goToMyBookings">
        {{ $t('consult.viewMyBookings') }}
      </Button>
      <Button type="button" variant="secondary" @click="emit('restart')">
        {{ $t('consult.bookAgain') }}
      </Button>
    </div>
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

.consultation-payment-result__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
</style>
