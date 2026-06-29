<script setup lang="ts">
interface DropdownOption {
  label: string;
  value: string;
}

withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    placeholder: string;
    options: DropdownOption[];
    error?: string;
    listLabel?: string;
    uppercaseValue?: boolean;
  }>(),
  {
    error: '',
    listLabel: 'Choose an option',
    uppercaseValue: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isOpen = defineModel<boolean>('open', { default: false });

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectOption(value: string) {
  emit('update:modelValue', value);
  isOpen.value = false;
}
</script>

<template>
  <div class="recommendation-panel__field">
    <span>{{ label }}</span>
    <div class="recommendation-panel__dropdown">
      <button
        type="button"
        class="recommendation-panel__dropdown-trigger"
        :class="{ 'recommendation-panel__dropdown-trigger--placeholder': !modelValue }"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        @click="toggleDropdown"
      >
        <span>{{ modelValue ? (uppercaseValue ? modelValue.toUpperCase() : modelValue) : placeholder }}</span>
        <span aria-hidden="true" class="recommendation-panel__dropdown-icon"></span>
      </button>

      <div
        v-if="isOpen"
        class="recommendation-panel__dropdown-menu"
        role="listbox"
        :aria-label="listLabel"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="recommendation-panel__dropdown-option"
          :class="{ 'recommendation-panel__dropdown-option--selected': modelValue === option.value }"
          role="option"
          :aria-selected="modelValue === option.value"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
    <small v-if="error">{{ error }}</small>
  </div>
</template>

<style scoped>
.recommendation-panel__field {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.recommendation-panel__field > span {
  color: #f0ede6d6;
  font-size: 0.9rem;
  font-weight: 600;
}

.recommendation-panel__dropdown {
  position: relative;
}

.recommendation-panel__dropdown-trigger {
  width: 100%;
  min-height: 47px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 20px;
  border-radius: 8px;
  background-color: #ffffff12;
  color: var(--color-text-primary);
  font-size: var(--text-caption);
  font-weight: 500;
  text-align: left;
  outline: none;
  transition:
    background-color 200ms ease,
    color 200ms ease;
}

.recommendation-panel__dropdown-trigger:hover,
.recommendation-panel__dropdown-trigger:focus {
  background-color: #ffffff1c;
}

.recommendation-panel__dropdown-trigger--placeholder {
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.recommendation-panel__dropdown-icon {
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
}

.recommendation-panel__dropdown-menu {
  position: absolute;
  z-index: 6;
  top: calc(100% + 10px);
  left: 0;
  display: grid;
  width: 100%;
  max-height: 260px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #ffffff29;
  border-radius: 8px;
  background: #2b2b2f;
  box-shadow: 0 18px 44px #00000057;
  backdrop-filter: blur(18px);
}

.recommendation-panel__dropdown-option {
  display: flex;
  min-height: 38px;
  align-items: center;
  border-radius: 6px;
  padding: 8px 12px;
  color: #f0ede6c7;
  font-size: var(--text-caption);
  font-weight: 600;
  text-align: left;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.recommendation-panel__dropdown-option:hover,
.recommendation-panel__dropdown-option:focus {
  background-color: #ffffff1f;
  color: var(--color-text-primary);
}

.recommendation-panel__dropdown-option--selected {
  color: var(--color-text-primary);
}

.recommendation-panel__field small {
  color: var(--color-stellar-red);
  font-family: var(--font-family-mono);
  font-size: 0.7rem;
}
</style>
