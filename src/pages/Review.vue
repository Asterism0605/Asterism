<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  fetchReviewQueue,
  submitReview,
  type ReviewAction,
  type ReviewImage,
  type ReviewTaxonomy
} from '@/api/review.api';
import { mediumZh, styleGroupZh, subMediumZh } from '@/data/styleLabels';

interface ReviewCard extends ReviewImage {
  draftMedium: string;
  draftSubMedium: string;
  confirmingCorrect: boolean;
}

const cards = ref<ReviewCard[]>([]);
const taxonomy = ref<ReviewTaxonomy>({ mediums: [], subMediumsByMedium: {} });
const activeGroup = ref<string | null>(null);
const isLoading = ref(false);
const error = ref('');

function toCard(image: ReviewImage): ReviewCard {
  return {
    ...image,
    draftMedium: image.medium ?? '',
    draftSubMedium: image.subMedium ?? '',
    confirmingCorrect: false
  };
}

const groupCounts = computed(() => {
  const counts = new Map<string, number>();
  for (const card of cards.value) {
    counts.set(card.styleGroup, (counts.get(card.styleGroup) ?? 0) + 1);
  }
  return [...counts.entries()].map(([group, count]) => ({ group, count }));
});

const visibleCards = computed(() =>
  activeGroup.value
    ? cards.value.filter((card) => card.styleGroup === activeGroup.value)
    : cards.value
);

async function loadQueue() {
  isLoading.value = true;
  error.value = '';
  try {
    const response = await fetchReviewQueue();
    taxonomy.value = response.taxonomy;
    cards.value = response.items.map(toCard);
  } catch {
    error.value = '載入失敗，請重試。';
  } finally {
    isLoading.value = false;
  }
}

function subMediumOptions(medium: string): string[] {
  return taxonomy.value.subMediumsByMedium[medium] ?? [];
}

async function run(card: ReviewCard, action: ReviewAction) {
  const payload =
    action === 'correct'
      ? { action, medium: card.draftMedium, subMedium: card.draftSubMedium }
      : { action };
  try {
    await submitReview(card.id, payload);
    cards.value = cards.value.filter((item) => item.id !== card.id);
  } catch {
    error.value = `送出失敗：${card.id}`;
  }
}

// correct 兩步：第一下進入確認態，確認才送出。
function startCorrect(card: ReviewCard) {
  card.confirmingCorrect = true;
}
function cancelCorrect(card: ReviewCard) {
  card.confirmingCorrect = false;
}
function confirmCorrect(card: ReviewCard) {
  void run(card, 'correct');
}
function approve(card: ReviewCard) {
  void run(card, 'approve');
}
function exclude(card: ReviewCard) {
  void run(card, 'exclude');
}

onMounted(() => {
  void loadQueue();
});
</script>

<template>
  <main class="min-h-screen bg-void px-6 py-10 text-text-primary">
    <div class="mx-auto max-w-6xl">
      <h1 class="mb-2 text-2xl font-bold">圖庫審核</h1>
      <p class="mb-6 text-sm text-text-secondary">
        逐筆審分類（medium / subMedium）：核可、修正或排除。待審 {{ cards.length }} 筆。
      </p>

      <p v-if="error" class="mb-4 text-sm text-stellar-red">{{ error }}</p>

      <div class="flex flex-col gap-8 lg:flex-row">
        <!-- 左側：依風格篩選 -->
        <aside class="lg:w-56 lg:shrink-0">
          <p class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-dim">風格</p>
          <ul class="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            <li>
              <button
                type="button"
                data-testid="review-filter"
                class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition"
                :class="
                  activeGroup === null
                    ? 'border-gold-dim/60 bg-gold-dim/15 text-text-primary'
                    : 'border-white/10 bg-elevated/40 text-text-secondary hover:border-white/25'
                "
                @click="activeGroup = null"
              >
                <span>全部</span>
                <span class="ml-2 rounded-full bg-void/60 px-2 py-0.5 text-[11px]">
                  {{ cards.length }}
                </span>
              </button>
            </li>
            <li v-for="entry in groupCounts" :key="entry.group">
              <button
                type="button"
                data-testid="review-filter"
                class="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition"
                :class="
                  activeGroup === entry.group
                    ? 'border-gold-dim/60 bg-gold-dim/15 text-text-primary'
                    : 'border-white/10 bg-elevated/40 text-text-secondary hover:border-white/25'
                "
                @click="activeGroup = entry.group"
              >
                <span>{{ styleGroupZh(entry.group) }}</span>
                <span class="ml-2 rounded-full bg-void/60 px-2 py-0.5 text-[11px]">
                  {{ entry.count }}
                </span>
              </button>
            </li>
          </ul>
        </aside>

        <!-- 右側：待審圖 -->
        <section class="flex-1">
          <p v-if="isLoading" class="text-sm text-gold-dim">Loading…</p>
          <p v-else-if="visibleCards.length === 0" class="text-sm text-text-secondary">
            沒有待審圖。
          </p>

          <ul class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <li
              v-for="card in visibleCards"
              :key="card.id"
              data-testid="review-card"
              class="overflow-hidden rounded-xl border border-white/12 bg-elevated/60"
            >
              <img :src="card.url" :alt="card.id" class="aspect-[4/5] w-full object-cover" />
              <div class="space-y-3 p-4">
                <p class="text-sm font-semibold">{{ styleGroupZh(card.styleGroup) }}</p>
                <p class="text-[11px] text-text-secondary">
                  {{ card.styleGroup }} · subMedium 信心
                  {{ card.confidence.subMedium?.toFixed(2) ?? '—' }}
                </p>

                <label class="block text-xs text-text-secondary">
                  類別 medium
                  <select
                    v-model="card.draftMedium"
                    data-testid="review-medium"
                    class="mt-1 w-full rounded-md border border-white/15 bg-void px-2 py-1.5 text-sm text-text-primary"
                  >
                    <option v-for="m in taxonomy.mediums" :key="m" :value="m">
                      {{ mediumZh(m) }}
                    </option>
                  </select>
                </label>

                <label class="block text-xs text-text-secondary">
                  子類別 subMedium
                  <select
                    v-model="card.draftSubMedium"
                    data-testid="review-submedium"
                    class="mt-1 w-full rounded-md border border-white/15 bg-void px-2 py-1.5 text-sm text-text-primary"
                  >
                    <option v-for="s in subMediumOptions(card.draftMedium)" :key="s" :value="s">
                      {{ subMediumZh(s) }}
                    </option>
                  </select>
                </label>

                <div class="flex gap-2 pt-1">
                  <template v-if="!card.confirmingCorrect">
                    <button
                      type="button"
                      data-testid="review-approve"
                      class="flex-1 rounded-md bg-gold-dim/80 px-2 py-1.5 text-xs font-semibold text-void transition hover:bg-gold-dim"
                      @click="approve(card)"
                    >
                      核可
                    </button>
                    <button
                      type="button"
                      data-testid="review-correct"
                      class="flex-1 rounded-md border border-white/25 px-2 py-1.5 text-xs font-semibold transition hover:border-white/45"
                      @click="startCorrect(card)"
                    >
                      修正
                    </button>
                    <button
                      type="button"
                      data-testid="review-exclude"
                      class="flex-1 rounded-md border border-stellar-red/50 px-2 py-1.5 text-xs font-semibold text-stellar-red transition hover:border-stellar-red"
                      @click="exclude(card)"
                    >
                      排除
                    </button>
                  </template>
                  <template v-else>
                    <button
                      type="button"
                      data-testid="review-correct-confirm"
                      class="flex-1 rounded-md bg-gold-dim/80 px-2 py-1.5 text-xs font-semibold text-void transition hover:bg-gold-dim"
                      @click="confirmCorrect(card)"
                    >
                      確認修正
                    </button>
                    <button
                      type="button"
                      data-testid="review-correct-cancel"
                      class="flex-1 rounded-md border border-white/25 px-2 py-1.5 text-xs font-semibold transition hover:border-white/45"
                      @click="cancelCorrect(card)"
                    >
                      取消
                    </button>
                  </template>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </main>
</template>
