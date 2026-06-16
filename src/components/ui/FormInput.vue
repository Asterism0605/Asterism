<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  modelValue: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  autocomplete?: string;
  errorMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  autocomplete: 'off',
  errorMessage: ''
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isPasswordVisible = ref(false);

const currentType = computed(() => {
  if (props.type === 'password') {
    return isPasswordVisible.value ? 'text' : 'password';
  }
  return props.type;
});

const internalError = computed(() => {
  if (props.type === 'password' && props.modelValue.length > 0 && props.modelValue.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  return props.errorMessage;
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function togglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value;
}
</script>

<template>
  <div class="form-control-group">
    <div class="input-wrapper">
      <input
        :value="modelValue"
        :type="currentType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        class="overlay-input"
        :class="{ 'input-error-border': !!internalError, 'pr-12': type === 'password' }"
        @input="handleInput"
      />

      <button
        v-if="type === 'password'"
        type="button"
        class="eye-button"
        @click="togglePasswordVisibility"
      >
        <svg
          v-if="isPasswordVisible"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="eye-icon"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="eye-icon"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      </button>
    </div>

    <span v-if="internalError" class="form-error-text">
      {{ internalError }}
    </span>
  </div>
</template>

<style scoped>
.form-control-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.eye-button {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.eye-button:hover {
  color: var(--color-text-primary);
}

.eye-icon {
  width: 20px;
  height: 20px;
}

.pr-12 {
  padding-right: 48px !important;
}

/* 隱藏瀏覽器（Edge/IE）內建的密碼顯示眼睛，只保留自製的 .eye-button，避免出現兩個眼睛。 */
.overlay-input::-ms-reveal,
.overlay-input::-ms-clear {
  display: none;
}

.form-error-text {
  font-family: var(--font-family-body);
  font-size: var(--text-mono);
  color: var(--color-stellar-red);
  margin-top: 6px;
  letter-spacing: 0.05em;
}

.input-error-border {
  border: 1px solid var(--color-stellar-red) !important;
}
</style>
