<script setup lang="ts">
import { computed } from 'vue';

type ProfileProps = {
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  showFollow?: boolean;
  followLabel?: string;
};

const props = withDefaults(defineProps<ProfileProps>(), {
  subtitle: '',
  avatarUrl: '',
  showFollow: false,
  followLabel: '+ Follow'
});

const initials = computed(() =>
  props.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
);
</script>

<template>
  <article class="rounded-[32px] p-7 sm:p-9">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div class="flex min-w-0 items-center gap-5">
        <div
          class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-dim text-xl font-semibold text-text-primary"
        >
          <img v-if="avatarUrl" :src="avatarUrl" :alt="name" class="size-full object-cover" />
          <span v-else>{{ initials }}</span>
        </div>

        <div class="min-w-0">
          <p class="truncate text-3xl font-medium leading-tight">
            {{ name }}
          </p>
          <p v-if="subtitle" class="mt-1 truncate text-sm text-text-secondary">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <button
        v-if="showFollow"
        type="button"
        class="min-h-12 rounded-full border border-text-primary/80 px-8 text-xl font-medium text-text-primary transition-all duration-200 hover:bg-text-primary hover:text-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary sm:ml-auto"
      >
        {{ followLabel }}
      </button>
    </div>
  </article>
</template>
