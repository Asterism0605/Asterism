<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLegalLastUpdated } from '@/composables/useLegalLastUpdated';
import privacyEn from '@/legal/privacy.en';
import privacyZh from '@/legal/privacy.zh';

const { locale } = useI18n();
const lastUpdated = useLegalLastUpdated('privacy');

const privacy = computed(() => (locale.value === 'zh' ? privacyZh : privacyEn));
</script>

<template>
  <main class="relative min-h-screen bg-void px-6 pb-24 pt-24 text-text-primary sm:pt-28">
    <div class="pointer-events-none fixed inset-0 z-0 legal-page__wash" aria-hidden="true" />

    <div class="relative z-10 mx-auto max-w-3xl">
      <p class="text-caption font-mono uppercase tracking-[0.24em] text-gold-dim">
        {{ privacy.eyebrow }}
      </p>
      <h1 class="text-h1 mt-3">{{ privacy.title }}</h1>
      <p class="text-caption mt-2 text-text-secondary">
        {{ lastUpdated.label }}: {{ lastUpdated.date }}
      </p>

      <div class="mt-10 space-y-8 text-body leading-7 text-text-secondary">
        <section v-if="privacy.intro.length">
          <p v-for="paragraph in privacy.intro" :key="paragraph" class="mt-3 first:mt-0">
            {{ paragraph }}
          </p>
        </section>

        <section v-for="section in privacy.sections" :key="section.title">
          <h2 class="text-h3 text-text-primary">{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-3">
            {{ paragraph }}
          </p>
          <ul v-if="section.bullets?.length" class="mt-3 list-disc space-y-2 pl-5">
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
          <div v-for="subsection in section.subsections" :key="subsection.title" class="mt-5">
            <h3 v-if="subsection.title" class="text-body font-semibold text-text-primary">
              {{ subsection.title }}
            </h3>
            <p v-for="paragraph in subsection.paragraphs" :key="paragraph" class="mt-3">
              {{ paragraph }}
            </p>
            <ul v-if="subsection.bullets?.length" class="mt-3 list-disc space-y-2 pl-5">
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
          <p v-if="section.contact" class="mt-3">
            {{ section.contact.prefix }}
            <a class="text-text-primary underline" :href="`mailto:${section.contact.email}`">
              {{ section.contact.email }}</a
            >{{ section.contact.suffix }}
          </p>
        </section>
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
