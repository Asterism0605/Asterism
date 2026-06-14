<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/Button.vue';
import FormInput from '@/components/ui/FormInput.vue';

interface SignUpPayload {
  email: string;
  password: string;
}

const emit = defineEmits<{
  submit: [payload: SignUpPayload];
}>();

const email = ref('');
const password = ref('');

function handleSubmit() {
  emit('submit', { email: email.value, password: password.value });
}
</script>

<template>
  <Teleport to="body">
    <div
      class="overlay-backdrop"
      style="background: none; backdrop-filter: none"
      role="presentation"
    >
      <section
        class="overlay-panel overlay-form glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Sign up"
        tabindex="-1"
      >
        <h2 class="overlay-title">Sign up</h2>

        <div class="overlay-fields">
          <FormInput v-model="email" type="email" placeholder="EMAIL" autocomplete="email" />
          <FormInput
            v-model="password"
            type="password"
            placeholder="PASSWORD"
            autocomplete="new-password"
          />
        </div>

        <div class="overlay-actions">
          <span class="overlay-submit">
            <Button variant="secondary" type="button" @click="handleSubmit">SEND</Button>
          </span>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
@media (max-width: 640px) {
  .overlay-title {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .overlay-fields {
    gap: 12px;
  }
}
</style>
