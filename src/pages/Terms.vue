<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import LegalDocumentPage from '@/components/legal/LegalDocumentPage.vue';
import { useLegalLastUpdated } from '@/composables/useLegalLastUpdated';
import termsEn from '@/i18n/legal/terms.en';
import termsZh from '@/i18n/legal/terms.zh';

const { locale } = useI18n();
const lastUpdated = useLegalLastUpdated('terms');

const document = computed(() => (locale.value === 'zh' ? termsZh : termsEn));
const lastUpdatedText = computed(() => ({
  label: lastUpdated.label.value,
  date: lastUpdated.date.value
}));
</script>

<template>
  <LegalDocumentPage :document="document" :last-updated="lastUpdatedText" />
</template>
