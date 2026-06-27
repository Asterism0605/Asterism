import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Review from '@/pages/Review.vue';
import * as reviewService from '@/services/review.service';

const queue = {
  items: [
    {
      id: 'ext-pexels-1',
      url: 'https://img/1.jpg',
      styleGroup: 'Y2K & Internet Aesthetics',
      medium: 'Graphic Design',
      subMedium: 'Poster Design',
      confidence: { styleGroup: 0.9, medium: 0.6, subMedium: 0.3 },
      needsReview: { styleGroup: false, medium: false, subMedium: true }
    },
    {
      id: 'ext-pexels-2',
      url: 'https://img/2.jpg',
      styleGroup: 'Street & Youth Culture',
      medium: 'Outfit',
      subMedium: 'Top',
      confidence: { styleGroup: 0.8, medium: 0.5, subMedium: 0.4 },
      needsReview: { styleGroup: false, medium: true, subMedium: true }
    }
  ],
  taxonomy: {
    mediums: ['Outfit', 'Graphic Design', 'Interior Design', 'Architecture'],
    subMediumsByMedium: {
      'Graphic Design': ['Brand Identity', 'Poster Design', 'Editorial Design', 'Packaging Design'],
      Outfit: ['Top', 'Bottom', 'Dress', 'Accessory'],
      'Interior Design': ['Lighting', 'Table', 'Wall Paint', 'Chair'],
      Architecture: ['Window', 'Staircase', 'Facade', 'Entrance']
    }
  }
};

async function mountReview() {
  const wrapper = mount(Review);
  await flushPromises();
  return wrapper;
}

describe('Review.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reviewService, 'fetchReviewQueue').mockResolvedValue(structuredClone(queue));
  });

  it('進頁即載入並列出待審圖', async () => {
    const wrapper = await mountReview();
    expect(wrapper.findAll('[data-testid="review-card"]')).toHaveLength(2);
  });

  it('approve 一鍵送出後該卡離開', async () => {
    const submit = vi.spyOn(reviewService, 'submitReview').mockResolvedValue();
    const wrapper = await mountReview();

    await wrapper.findAll('[data-testid="review-approve"]')[0].trigger('click');
    await flushPromises();

    expect(submit).toHaveBeenCalledWith('ext-pexels-1', 'approve', {
      needsReview: { styleGroup: false, medium: false, subMedium: true },
      draftMedium: 'Graphic Design',
      draftSubMedium: 'Poster Design'
    });
    expect(wrapper.findAll('[data-testid="review-card"]')).toHaveLength(1);
  });

  it('correct 需先按修正→確認才送出', async () => {
    const submit = vi.spyOn(reviewService, 'submitReview').mockResolvedValue();
    const wrapper = await mountReview();

    await wrapper.findAll('[data-testid="review-correct"]')[0].trigger('click');
    expect(submit).not.toHaveBeenCalled();

    await wrapper.find('[data-testid="review-correct-confirm"]').trigger('click');
    await flushPromises();

    expect(submit).toHaveBeenCalledWith('ext-pexels-1', 'correct', {
      needsReview: { styleGroup: false, medium: false, subMedium: true },
      draftMedium: 'Graphic Design',
      draftSubMedium: 'Poster Design'
    });
  });

  it('每張卡片標出需審欄位（badge）', async () => {
    const wrapper = await mountReview();
    const cards = wrapper.findAll('[data-testid="review-card"]');
    // 第一張只有 subMedium 需審
    expect(cards[0].find('[data-testid="review-flag-medium"]').exists()).toBe(false);
    expect(cards[0].find('[data-testid="review-flag-submedium"]').exists()).toBe(true);
    // 第二張 medium + subMedium 都需審
    expect(cards[1].find('[data-testid="review-flag-medium"]').exists()).toBe(true);
    expect(cards[1].find('[data-testid="review-flag-submedium"]').exists()).toBe(true);
  });
});
