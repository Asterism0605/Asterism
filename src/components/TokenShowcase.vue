<script setup lang="ts">
const colors = [
  { name: 'void', hex: '#060608', textDark: false },
  { name: 'deep', hex: '#0E0E12', textDark: false },
  { name: 'elevated', hex: '#17171D', textDark: false },
  { name: 'overlay', hex: '#222228', textDark: false },
  { name: 'text-primary', hex: '#F0EDE6', textDark: true },
  { name: 'text-secondary', hex: '#8A8880', textDark: true },
  { name: 'stellar-red', hex: '#C45C3A', textDark: false },
  { name: 'gold-dim', hex: '#A8893A', textDark: false },
];

const typographySamples = [
  {
    label: 'Display / Title',
    size: 'text-display',
    value: '128px',
    sample: 'Asterism',
  },
  {
    label: 'Heading 1 (H1)',
    size: 'text-h1',
    value: '36px',
    sample: 'Discover your aesthetic',
  },
  {
    label: 'Heading 2 (H2)',
    size: 'text-h2',
    value: '24px',
    sample: 'Build your visual identity',
  },
  {
    label: 'Body',
    size: 'text-body',
    value: '16px',
    sample: '將散落的美學，連成屬於你的星座。',
  },
  {
    label: 'Caption',
    size: 'text-caption',
    value: '14px',
    sample: 'Networking is the art of building connections that move you forward.',
  },
  {
    label: 'Mono / Label',
    size: 'text-mono',
    value: '12px',
    sample: '--color-stellar-red · #C45C3A · TAG · MVP',
  },
];

const shadowSamples = [
  { label: 'shadow-sm', style: '0 2px 8px rgba(0, 0, 0, 0.4)' },
  { label: 'shadow-md', style: '0 4px 16px rgba(0, 0, 0, 0.6)' },
  { label: 'shadow-lg', style: '0 8px 32px rgba(0, 0, 0, 0.8)' },
];

const radiusSamples = [
  { label: 'radius-sm', value: '4px' },
  { label: 'radius-md', value: '8px' },
  { label: 'radius-lg', value: '16px' },
  { label: 'radius-full', value: '9999px' },
];
</script>

<template>
  <main class="min-h-screen bg-img text-text-primary pb-24">
    <div class="max-w-6xl mx-auto px-8 pt-12 flex flex-col gap-16">

      <!-- Section 1: 色彩系統 -->
      <section>
        <div class="flex items-baseline gap-3 mb-6">
          <h2 class="font-bold text-h2 tracking-tight">色彩系統</h2>
          <span class=" text-xs text-text-secondary tracking-widest uppercase">Color Tokens</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="c in colors"
            :key="c.name"
            class="flex flex-col gap-3 p-4 rounded-2xl bg-elevated border border-white/5 hover:border-white/10 transition-all duration-300 group cursor-default"
          >
            <div
              class="h-20 w-full rounded-xl shadow-inner flex items-end p-2"
              :style="{ backgroundColor: c.hex }"
            >
              <span
                class="text-[10px]  opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-0.5 rounded-md"
                :class="c.textDark ? 'bg-black/30 text-black' : 'bg-white/10 text-white'"
              >--color-{{ c.name }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-semibold text-text-primary capitalize">{{ c.name.replace(/-/g, ' ') }}</span>
              <span class="text-[11px]  text-text-secondary">{{ c.hex }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: 字體系統 -->
      <section>
        <div class="flex items-baseline gap-3 mb-6">
          <h2 class="font-bold text-h2 tracking-tight">字體系統</h2>
          <span class=" text-xs text-text-secondary tracking-widest uppercase">Typography Scale</span>
        </div>
        <div class="flex flex-col divide-y divide-white/5 bg-elevated rounded-3xl border border-white/5 overflow-hidden">
          <div
            v-for="t in typographySamples"
            :key="t.label"
            class="flex flex-col sm:flex-row items-start sm:items-center gap-8 px-8 py-6 hover:bg-white/[0.02] transition-colors duration-200"
          >
            <div class="w-full sm:w-52 shrink-0">
              <span class="text-xs text-text-secondary">{{ t.label }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <span
                :class="[t.size, 'block text-text-primary leading-tight break-words whitespace-normal']"
              >
                {{ t.sample }}
              </span>
            </div>
            <div class="w-full sm:w-20 text-right shrink-0">
              <span class="text-[10px] text-text-secondary tabular-nums">
                {{ t.value }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: 圓角與陰影 -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 圓角 -->
        <div>
          <div class="flex items-baseline gap-3 mb-6">
              <h2 class="font-bold text-h2 tracking-tight">圓角</h2>
            <span class=" text-xs text-text-secondary tracking-widest uppercase">Border Radius</span>
          </div>
          <div class="flex flex-col gap-6">
            <div v-for="r in radiusSamples" :key="r.label" class="flex items-center gap-6">
              <div class="w-20 h-12 bg-overlay border border-white/10 shrink-0" :style="{ borderRadius: r.value }"></div>
              <div>
                <span class="font-semibold text-text-primary">{{ r.label }}</span>
                <span class="block text-xs  text-text-secondary">{{ r.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 陰影 -->
        <div class="bg-text-secondary p-6 rounded-3xl">
          <div class="flex items-baseline gap-3 mb-6">
              <h2 class="font-bold text-h2 tracking-tight">陰影</h2>
            <span class=" text-xs text-deep tracking-widest uppercase">Shadows</span>
          </div>
          <div class="flex flex-col gap-6">
            <div v-for="s in shadowSamples" :key="s.label" class="flex items-center gap-6">
              <div class="w-20 h-12 rounded-2xl bg-elevated border border-white/5 shrink-0" :style="{ boxShadow: s.style }"></div>
              <div>
                <span class="font-semibold text-deep">{{ s.label }}</span>
                <span class="block text-xs  text-overlay leading-relaxed">{{ s.style }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: 元件應用範例 -->
      <section>
        <div class="flex items-baseline gap-3 mb-6">
          <h2 class="font-bold text-h2 tracking-tight">元件應用</h2>
          <span class=" text-xs text-text-secondary tracking-widest uppercase">Component Showcase</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 毛玻璃卡片 -->
          <div class="glass-panel rounded-3xl p-8 flex flex-col gap-6 card-hover">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-2xl bg-stellar-red/60 flex items-center justify-center">
                <span class="text-white text-base font-bold">ZR</span>
              </div>
              <div>
                <p class="text-body font-semibold">Zhenya Rukhlov</p>
                <p class="text-caption text-text-secondary">Photographer · Aug 19, 2025</p>
              </div>
              <button class="cursor-pointer ml-auto text-xs border border-white/10 text-text-primary px-4 py-2 rounded-2xl hover:bg-white/5 transition-colors duration-200">
                + Follow
              </button>
            </div>
            <div>
              <p class="text-caption text-text-secondary mb-3  uppercase tracking-wider">Theme Tags</p>
              <div class="flex flex-wrap gap-2">
                <span
v-for="tag in ['Avant-garde', 'Industrial', 'Monochrome', 'Editorial']" :key="tag"
                  class="text-xs  text-gold-dim border border-gold-dim/30 px-3 py-1 rounded-2xl">
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button class="cursor-pointer flex-1 py-3 rounded-2xl border border-white/20 text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors duration-200">
                Consult Stylist
              </button>
              <button class="cursor-pointer flex-1 py-3 rounded-2xl bg-stellar-red text-text-primary text-sm font-semibold hover:opacity-90 active:scale-[0.985] transition-all duration-200">
                Add to Moodboard
              </button>
            </div>
          </div>

          <!-- Tokens 資訊卡 -->
          <div class="bg-elevated rounded-3xl p-8 border border-white/5 flex flex-col gap-6 card-hover">
            <p class="text-xs  text-text-secondary uppercase tracking-widest">Design System Summary</p>
            <div class="flex flex-col divide-y divide-white/5">
              <div class="flex justify-between py-3">
                <span class="text-sm text-text-secondary">顏色 Tokens</span>
                <span class="text-sm  text-text-primary">8 colors</span>
              </div>
              <div class="flex justify-between py-3">
                <span class="text-sm text-text-secondary">字體 Tokens</span>
                <span class="text-sm  text-text-primary">Outfit + Inter + Noto TC</span>
              </div>
              <div class="flex justify-between py-3">
                <span class="text-sm text-text-secondary">圓角 Tokens</span>
                <span class="text-sm  text-text-primary">4 levels</span>
              </div>
              <div class="flex justify-between py-3">
                <span class="text-sm text-text-secondary">陰影 Tokens</span>
                <span class="text-sm  text-text-primary">3 levels</span>
              </div>
              <div class="flex justify-between py-3">
                <span class="text-sm text-text-secondary">Tailwind 版本</span>
                <span class="text-sm  text-gold-dim">v4 (CSS-first · @theme)</span>
              </div>
              <div class="flex justify-between py-3">
                <span class="text-sm text-text-secondary">框架</span>
                <span class="text-sm  text-text-primary">Vue 3 + Vite + TS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </main>
</template>