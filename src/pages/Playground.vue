<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/components/ui/Button.vue';
import ConstellationBackground from '@/components/effects/ConstellationBackground.vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import FormInput from '@/components/ui/FormInput.vue';

const isLimitModalOpen = ref(false);
const hoveredItemId = ref<number | null>(null);

const email = ref('');
const password = ref('');

const inspirationItems = [
  {
    id: 1,
    title: 'Chrome noir chair',
    category: 'Object',
    image: new URL('@/assets/hero.png', import.meta.url).href,
    position: 'lg:translate-y-8'
  },
  {
    id: 2,
    title: 'Shadow editorial',
    category: 'Style',
    image: new URL('@/assets/background.jpg', import.meta.url).href,
    position: 'lg:-translate-y-4'
  }
];
</script>

<template>
  <main class="min-h-screen px-4 pb-20 pt-28 text-text-primary sm:px-8">
    <section class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
      <div class="max-w-xl">
        <p class="text-mono uppercase tracking-[0.28em] text-gold-dim">Component Playground</p>
        <h1 class="mt-5 text-h1 font-normal leading-tight">
          Asterism overlay and constellation effects
        </h1>
        <p class="mt-5 max-w-lg text-sm leading-normal text-text-secondary sm:text-base">
          Hover the image tiles to reveal the constellation background, then open the modal to check
          the glass dialog layer in context.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <Button @click="isLimitModalOpen = true">Open Limit Modal</Button>
          <Button variant="secondary" @click="isLimitModalOpen = true">Preview Overlay</Button>
        </div>
      </div>

      <div class="grid min-h-[520px] grid-cols-1 gap-10 sm:gap-25 sm:grid-cols-2 sm:items-center">
        <article
          v-for="item in inspirationItems"
          :key="item.id"
          class="group relative min-h-80 overflow-visible"
          :class="item.position"
          @mouseenter="hoveredItemId = item.id"
          @mouseleave="hoveredItemId = null"
          @focusin="hoveredItemId = item.id"
          @focusout="hoveredItemId = null"
        >
          <ConstellationBackground
            class-name="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
            :active="hoveredItemId === item.id"
            :size="460"
            :line-length="250"
            :line-width="1.6"
            :line-opacity="0.82"
            :glow-opacity="0.16"
            :node-size="3.5"
            :spacing="50"
          />

          <button
            class="relative z-10 flex h-full min-h-80 w-full cursor-pointer flex-col justify-end overflow-hidden rounded-lg border border-white/10 bg-elevated text-left transition duration-300 hover:-translate-y-1 hover:border-gold-dim/50 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
            type="button"
            @click="isLimitModalOpen = true"
          >
            <img
              class="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
              :src="item.image"
              :alt="item.title"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-void via-void/35 to-transparent" />
            <div class="relative z-10 p-5">
              <p class="text-mono uppercase tracking-[0.22em] text-gold-dim">
                {{ item.category }}
              </p>
              <h2 class="mt-2 text-xl font-normal">{{ item.title }}</h2>
            </div>
          </button>
        </article>
      </div>
    </section>

    <section class="mx-auto mt-24 max-w-md border-t border-white/5 pt-16">
      <div class="overlay-fields">
        <FormInput v-model="email" type="email" placeholder="EMAIL" autocomplete="email" />

        <FormInput
          v-model="password"
          type="password"
          placeholder="PASSWORD"
          autocomplete="new-password"
        />
      </div>
    </section>

    <ModalOverlay v-model="isLimitModalOpen" max-width="590px">
      <template #icon>
        <div
          class="flex size-14 items-center justify-center rounded-full bg-void/70 text-text-primary"
        >
          <svg
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
      </template>

      <template #title>Your daily inspiration limit has been reached.</template>

      <template #description>
        Create a free account to unlock endless scrolling, save your favorite pieces to boards, and
        define your aesthetic DNA.
      </template>

      <template #actions>
        <Button variant="primary">Create Free Account</Button>
        <Button variant="secondary">Log In</Button>
      </template>
    </ModalOverlay>
  </main>
</template>
