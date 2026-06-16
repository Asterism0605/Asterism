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
  <article class="rounded-3xl py-4 sm:rounded-[32px]">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div class="flex min-w-0 items-center gap-4 sm:gap-5">
        <div
          class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-dim text-mono text-sm font-semibold text-text-primary sm:text-base"
        >
          <img v-if="avatarUrl" :src="avatarUrl" :alt="name" class="size-full object-cover" />
          <span v-else>{{ initials }}</span>
        </div>

        <div class="min-w-0">
          <p class="truncate text-body font-medium leading-tight">
            {{ name }}
          </p>
          <p v-if="subtitle" class="mt-1 truncate text-xs text-text-secondary sm:text-sm">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <button
        v-if="showFollow"
        type="button"
        class="px-4 sm:px-5 py-1.5 sm:py-2 w-full cursor-pointer rounded-full border border-text-primary/80 px-5 text-sm font-medium text-text-primary transition-all duration-200 hover:bg-text-primary hover:text-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary sm:ml-auto sm:w-auto sm:px-4 sm:text-body"
      >
        {{ followLabel }}
      </button>
    </div>
  </article>
</template>
