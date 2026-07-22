<script setup lang="ts">
import { computed } from 'vue';
import { useStyleTagLabel } from '@/composables/useStyleTagLabel';

type ConsultantSummaryStatus = 'missing-result' | 'ready';

interface ConsultantProfile {
  styleDna: Array<{
    label: string;
    percentage: number;
  }>;
  // 選了設計領域才查得到對應顧問，未選之前是 null，顯示待配對提示。
  consultantLabel: string | null;
  // 顯示的是後端確認指派的顧問(true / 預設)還是表單即時預覽(false)。
  // 預覽時 dt 標籤用「可能配對顧問」提醒可能與最終指派不同。
  matchIsConfirmed?: boolean;
}

const props = withDefaults(
  defineProps<{
    status?: ConsultantSummaryStatus;
    profile?: ConsultantProfile | null;
    hasSourceData?: boolean;
  }>(),
  {
    status: undefined,
    profile: null,
    hasSourceData: false
  }
);

const effectiveStatus = computed<ConsultantSummaryStatus>(() => {
  if (props.status) {
    return props.status;
  }

  return props.hasSourceData && props.profile ? 'ready' : 'missing-result';
});

const canShowProfile = computed(() => effectiveStatus.value === 'ready' && props.profile !== null);

const { displayLabel } = useStyleTagLabel();
</script>

<template>
  <section class="consultant-summary">
    <div>
      <p class="consultant-summary__eyebrow">{{ $t('consult.eyebrow') }}</p>
      <h1 class="consultant-summary__title">{{ $t('consult.title') }}</h1>
    </div>

    <div class="consultant-summary__copy">
      <p>{{ $t('consult.intro1') }}</p>
      <p>{{ $t('consult.intro2') }}</p>
    </div>

    <dl v-if="canShowProfile && profile" class="consultant-summary__profile">
      <div>
        <dt>Style DNA</dt>
        <dd>
          <ol class="consultant-summary__dna-list">
            <li v-for="style in profile.styleDna" :key="style.label">
              <span>{{ displayLabel(style.label) }}</span>
              <span>{{ style.percentage }}%</span>
            </li>
          </ol>
        </dd>
      </div>
      <div>
        <dt>
          {{ $t(profile.matchIsConfirmed === false
            ? 'consult.matchedConsultantPreview'
            : 'consult.matchedConsultant') }}
        </dt>
        <dd>{{ profile.consultantLabel ?? $t('consult.matchedConsultantPending') }}</dd>
      </div>
    </dl>

    <div v-else class="consultant-summary__fallback" data-testid="consultant-style-dna-fallback">
      <p>{{ $t('consult.needDna') }}</p>
      <div class="consultant-summary__actions">
        <RouterLink
          class="consultant-summary__button consultant-summary__button--primary"
          to="/style-dna"
        >
          {{ $t('consult.retakeQuiz') }}
        </RouterLink>
        <button class="consultant-summary__button" type="button">{{ $t('consult.skip') }}</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.consultant-summary {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 28px;
}

.consultant-summary__eyebrow {
  margin-bottom: 30px;
  color: var(--color-gold-dim);
  font-family: var(--font-family-mono);
  font-size: var(--text-mono);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.consultant-summary__title {
  font-size: clamp(2.5rem, 7vw, 5.75rem);
  font-weight: 200;
  line-height: 1.1;
  letter-spacing: 0;
}

.consultant-summary__copy {
  max-width: 590px;
  display: grid;
  gap: 12px;
  color: #f0ede6c2;
  font-size: 14px;
  line-height: 1.6;
}

.consultant-summary__profile {
  display: grid;
  max-width: 680px;
  margin-top: auto;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid #ffffff1a;
  border-radius: 8px;
  background: #ffffff0b;
}

.consultant-summary__profile div {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 18px;
  border-right: 1px solid #ffffff14;
}

.consultant-summary__profile div:last-child {
  border-right: 0;
}

.consultant-summary__profile dt {
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-size: var(--text-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.consultant-summary__profile dd {
  color: var(--color-text-primary);
  font-size: 0.95rem;
  line-height: 1.45;
}

.consultant-summary__dna-list {
  display: grid;
  gap: 10px;
}

.consultant-summary__dna-list li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.consultant-summary__dna-list li span:last-child {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-size: var(--text-mono);
}

.consultant-summary__fallback {
  max-width: 560px;
  display: grid;
  gap: 18px;
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #ffffff1a;
  border-radius: 8px;
  background: #ffffff0b;
  color: #f0ede6c7;
}

.consultant-summary__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.consultant-summary__button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid #ffffff33;
  border-radius: 9999px;
  padding: 8px 18px;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  transition:
    background 200ms ease,
    border-color 200ms ease,
    opacity 200ms ease;
}

.consultant-summary__button:hover {
  border-color: #ffffff57;
  background: #ffffff0f;
}

.consultant-summary__button--primary {
  border-color: transparent;
  background: var(--color-stellar-red);
}

.consultant-summary__button--primary:hover {
  border-color: transparent;
  background: var(--color-stellar-red);
  opacity: 0.9;
}

@media (max-width: 720px) {
  .consultant-summary {
    height: auto;
  }

  .consultant-summary__title {
    font-size: 3.6rem;
    line-height: 1.05;
  }

  .consultant-summary__profile {
    margin-top: 0;
    grid-template-columns: 1fr;
  }

  .consultant-summary__profile div {
    border-right: 0;
    border-bottom: 1px solid #ffffff14;
  }

  .consultant-summary__profile div:last-child {
    border-bottom: 0;
  }
}
</style>
