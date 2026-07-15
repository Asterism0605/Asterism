<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import { useStyleTagLabel } from '@/composables/useStyleTagLabel';
import { STYLE_TAG_DESCRIPTIONS } from '@/data/styleTagDescriptions';

const props = defineProps<{
  modelValue: boolean;
  tagLabel: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { locale } = useI18n();
const { displayLabel } = useStyleTagLabel();

const description = computed(() => {
  if (!props.tagLabel) return null;
  return STYLE_TAG_DESCRIPTIONS[props.tagLabel] ?? null;
});

const isOpen = computed(() => props.modelValue && props.tagLabel !== null && description.value !== null);

const descriptionText = computed(() =>
  description.value ? (locale.value === 'zh' ? description.value.zh : description.value.en) : ''
);
</script>

<template>
  <ModalOverlay
    :model-value="isOpen"
    show-close-button
    max-width="420px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="tagLabel" #title>
      {{ displayLabel(tagLabel) }}
    </template>
    <template v-if="tagLabel" #description>
      {{ descriptionText }}
    </template>
  </ModalOverlay>
</template>
