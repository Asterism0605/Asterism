<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import LegalDocumentPage from '@/components/legal/LegalDocumentPage.vue';
import { useLegalLastUpdated } from '@/composables/useLegalLastUpdated';
import privacyEn from '@/i18n/legal/privacy.en';
import privacyZh from '@/i18n/legal/privacy.zh';

const { locale } = useI18n();
const lastUpdated = useLegalLastUpdated('privacy');

const document = computed(() => (locale.value === 'zh' ? privacyZh : privacyEn));
const lastUpdatedText = computed(() => ({
  label: lastUpdated.label.value,
  date: lastUpdated.date.value
}));
</script>

<template>
  <LegalDocumentPage :document="document" :last-updated="lastUpdatedText" />
</template>
