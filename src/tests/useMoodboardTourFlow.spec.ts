import { computed, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useMoodboardTourFlow } from '@/composables/guide/useMoodboardTourFlow';

describe('useMoodboardTourFlow', () => {
  it('previews a populated folder before presenting the folder step', () => {
    const previewFolder = vi.fn();
    const showStep = vi.fn();
    const coreTour = {
      state: ref({ status: 'active', currentChapter: 'moodboard', step: 'moodboard-folder' }),
      showStep,
      pause: vi.fn(),
      advance: vi.fn(),
      completeChapter: vi.fn()
    };

    const flow = useMoodboardTourFlow({
      coreTour: coreTour as unknown as Parameters<typeof useMoodboardTourFlow>[0]['coreTour'],
      folders: computed(() => [
        { images: [] },
        { images: [{ id: 'image-1' }] }
      ]),
      status: computed(() => 'success'),
      isEmpty: computed(() => false),
      hasFolders: ref(true),
      previewFolder,
      goHome: vi.fn()
    });

    flow.showCurrentStep();

    expect(previewFolder).toHaveBeenCalledWith(1);
    expect(showStep).toHaveBeenCalledWith('moodboard-folder', expect.any(Object));
  });
});
