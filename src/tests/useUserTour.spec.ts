import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getUserTourStorageKey,
  useUserTour
} from '@/composables/guide/useUserTour';

const UserTourHarness = defineComponent({
  props: {
    userId: { type: String, required: true }
  },
  setup(props) {
    return useUserTour(() => props.userId);
  },
  template: '<div />'
});

describe('useUserTour', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('persists a paused step per authenticated user and resumes it', () => {
    const tour = useUserTour('user-a');

    tour.start('image-42');
    tour.advance('spread-related-group');
    tour.pause();

    expect(tour.state.value).toMatchObject({
      enabled: true,
      status: 'paused',
      step: 'spread-related-group',
      targetImageId: 'image-42'
    });

    const restored = useUserTour('user-a');
    restored.resume();

    expect(restored.state.value.status).toBe('active');
    expect(restored.state.value.step).toBe('spread-related-group');
    expect(useUserTour('user-b').state.value.status).toBe('idle');
  });

  it('opts out without marking the tour complete and only restart clears progress', () => {
    const tour = useUserTour('user-a');

    tour.start('image-42');
    tour.advance('detail-style-tag');
    tour.pause();
    tour.setEnabled(false);

    expect(tour.state.value).toMatchObject({
      enabled: false,
      status: 'paused',
      step: 'detail-style-tag'
    });

    tour.restart('image-99');

    expect(tour.state.value).toMatchObject({
      enabled: true,
      status: 'active',
      step: 'home-overview',
      targetImageId: 'image-99'
    });
  });

  it('falls back to idle and removes malformed persisted state', () => {
    const key = getUserTourStorageKey('user-a');
    localStorage.setItem(key, JSON.stringify({ status: 'mystery', step: 12 }));

    const tour = useUserTour('user-a');

    expect(tour.state.value).toMatchObject({
      enabled: true,
      status: 'idle',
      step: null
    });
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('marks an exploration chapter as a transition without completing the whole tour', () => {
    const tour = useUserTour('user-a');

    tour.start('image-42');
    tour.advance('detail-save', 'image-42');
    tour.pause();
    tour.completeChapter('exploration');

    expect(tour.state.value).toMatchObject({
      status: 'transition',
      currentChapter: 'exploration',
      step: null,
      completedChapters: ['exploration']
    });

    tour.enterChapter('moodboard', 'moodboard-images');

    expect(tour.state.value).toMatchObject({
      status: 'paused',
      currentChapter: 'moodboard',
      step: 'moodboard-images',
      completedChapters: ['exploration']
    });
  });

  it('resumes the exact paused Moodboard step', () => {
    const tour = useUserTour('user-a');

    tour.enterChapter('moodboard', 'moodboard-filters');
    tour.resume();

    expect(tour.state.value).toMatchObject({
      status: 'active',
      currentChapter: 'moodboard',
      step: 'moodboard-filters'
    });

    tour.complete();

    expect(tour.state.value).toMatchObject({
      status: 'completed',
      currentChapter: null,
      step: null
    });
  });

  it('syncs a completed chapter to every same-user instance when persistence fails', async () => {
    const first = mount(UserTourHarness, { props: { userId: 'user-1' } });
    const second = mount(UserTourHarness, { props: { userId: 'user-1' } });
    first.vm.start('image-42');
    first.vm.advance('detail-save', 'image-42');
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    first.vm.completeChapter('exploration');
    await second.vm.$nextTick();

    expect(first.vm.state).toMatchObject({
      status: 'transition',
      currentChapter: 'exploration',
      completedChapters: ['exploration']
    });
    expect(second.vm.state).toMatchObject({
      status: 'transition',
      currentChapter: 'exploration',
      completedChapters: ['exploration']
    });

    first.unmount();
    second.unmount();
  });

  it('syncs Moodboard chapter entry to every same-user instance when persistence fails', async () => {
    const first = mount(UserTourHarness, { props: { userId: 'user-1' } });
    const second = mount(UserTourHarness, { props: { userId: 'user-1' } });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    first.vm.enterChapter('moodboard', 'moodboard-images');
    await second.vm.$nextTick();

    expect(first.vm.state).toMatchObject({
      status: 'paused',
      currentChapter: 'moodboard',
      step: 'moodboard-images'
    });
    expect(second.vm.state).toMatchObject({
      status: 'paused',
      currentChapter: 'moodboard',
      step: 'moodboard-images'
    });

    first.unmount();
    second.unmount();
  });

  it('does not apply a user tour state event to a different user', async () => {
    const first = mount(UserTourHarness, { props: { userId: 'user-1' } });
    const second = mount(UserTourHarness, { props: { userId: 'user-2' } });

    first.vm.start('image-42');
    await second.vm.$nextTick();

    expect(first.vm.state.status).toBe('active');
    expect(second.vm.state.status).toBe('idle');

    first.unmount();
    second.unmount();
  });
});
