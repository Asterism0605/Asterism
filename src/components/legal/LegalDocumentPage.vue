<script setup lang="ts">
import type { LegalDocument, LegalSection } from '@/i18n/legal/types';

defineProps<{
  document: LegalDocument;
  lastUpdated: {
    label: string;
    date: string;
  };
}>();

function sectionHasBody(section: LegalSection): boolean {
  return Boolean(section.paragraphs?.length || section.bullets?.length || section.subsections?.length);
}
</script>

<template>
  <main class="relative min-h-screen bg-void px-6 pb-24 pt-24 text-text-primary sm:pt-28">
    <div class="pointer-events-none fixed inset-0 z-0 legal-page__wash" aria-hidden="true" />

    <div class="relative z-10 mx-auto max-w-3xl">
      <p class="text-caption font-mono uppercase tracking-[0.24em] text-gold-dim">
        {{ document.eyebrow }}
      </p>
      <h1 class="text-h1 mt-3">{{ document.title }}</h1>
      <p class="text-caption mt-2 text-text-secondary">
        {{ lastUpdated.label }}: {{ lastUpdated.date }}
      </p>

      <div class="mt-10 space-y-8 text-body leading-7 text-text-secondary">
        <section v-if="document.intro.length">
          <p v-for="paragraph in document.intro" :key="paragraph" class="mt-3 first:mt-0">
            {{ paragraph }}
          </p>
        </section>

        <section
          v-for="section in document.sections"
          :key="section.title"
          :class="{ 'space-y-3': sectionHasBody(section) }"
        >
          <h2 class="text-h3 text-text-primary">{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">
            {{ paragraph }}
          </p>
          <ul v-if="section.bullets?.length" class="list-disc space-y-2 pl-5">
            <li
              v-for="bullet in section.bullets"
              :key="typeof bullet === 'string' ? bullet : bullet.label"
            >
              <template v-if="typeof bullet === 'string'">{{ bullet }}</template>
              <template v-else>
                <strong class="text-text-primary">{{ bullet.label }}</strong> {{ bullet.text }}
              </template>
            </li>
          </ul>
          <div v-for="subsection in section.subsections" :key="subsection.title" class="space-y-3">
            <h3 v-if="subsection.title" class="text-body font-semibold text-text-primary">
              {{ subsection.title }}
            </h3>
            <p v-for="paragraph in subsection.paragraphs" :key="paragraph">
              {{ paragraph }}
            </p>
            <ul v-if="subsection.bullets?.length" class="list-disc space-y-2 pl-5">
              <li
                v-for="bullet in subsection.bullets"
                :key="typeof bullet === 'string' ? bullet : bullet.label"
              >
                <template v-if="typeof bullet === 'string'">{{ bullet }}</template>
                <template v-else>
                  <strong class="text-text-primary">{{ bullet.label }}</strong> {{ bullet.text }}
                </template>
              </li>
            </ul>
          </div>
          <p v-if="section.contact">
            {{ section.contact.prefix }}
            <a class="text-text-primary underline" :href="`mailto:${section.contact.email}`">
              {{ section.contact.email }}</a
            >{{ section.contact.suffix }}
          </p>
        </section>

        <p v-if="document.copyright" class="text-caption text-text-secondary">
          {{ document.copyright }}
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.legal-page__wash {
  background:
    radial-gradient(circle at 78% 12%, rgb(168 137 58 / 0.06), transparent 30%),
    linear-gradient(180deg, var(--color-void) 0%, var(--color-deep) 60%, var(--color-void) 100%);
}

.legal-page__wash::after {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.3;
  background-image:
    linear-gradient(rgb(240 237 230 / 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgb(240 237 230 / 0.6) 1px, transparent 1px);
  background-size: 118px 118px;
  mask-image: linear-gradient(180deg, transparent, black 12%, black 78%, transparent);
}
</style>
