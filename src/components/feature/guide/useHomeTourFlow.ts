import { computed, nextTick, onBeforeUnmount, ref, type Ref } from 'vue';
import { useHomeImageGuide } from './useHomeImageGuide';
import { useWelcomeTour } from './useWelcomeTour';

export function useHomeTourFlow(isAuthenticated: Readonly<Ref<boolean>>) {
  const welcomeTour = useWelcomeTour();
  const imageNetworkReady = ref(false);
  const pendingTourStart = ref(false);
  const guideTargetIndex = ref<number | null>(null);
  const {
    isVisible: isImageGuideVisible,
    completeGuide,
    findTargetIndex,
    startGuide,
    restartGuide
  } = useHomeImageGuide();
  let guideFrameId: number | null = null;

  const isHomeTourVisible = computed(
    () => isAuthenticated.value && !welcomeTour.isHandled.value
  );

  async function startImageClickGuide(restart = false): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    await nextTick();
    if (guideFrameId !== null) {
      window.cancelAnimationFrame(guideFrameId);
    }

    guideFrameId = window.requestAnimationFrame(() => {
      guideFrameId = null;
      const targetIndex = findTargetIndex();
      if (targetIndex === null) {
        return;
      }

      if (restart) {
        restartGuide();
        pendingTourStart.value = false;
      } else {
        startGuide();
      }
      guideTargetIndex.value = isImageGuideVisible.value ? targetIndex : null;
    });
  }

  function handleHomeTourStart(): void {
    welcomeTour.complete();
    pendingTourStart.value = true;

    if (imageNetworkReady.value) {
      void startImageClickGuide(true);
    }
  }

  function handleHomeTourExplore(): void {
    welcomeTour.complete();
  }

  function handleImageNetworkReady(): void {
    imageNetworkReady.value = true;

    if (pendingTourStart.value) {
      void startImageClickGuide(true);
      return;
    }

    if (!isAuthenticated.value) {
      void startImageClickGuide();
    }
  }

  onBeforeUnmount(() => {
    if (guideFrameId !== null) {
      window.cancelAnimationFrame(guideFrameId);
    }
  });

  return {
    isHomeTourVisible,
    isImageGuideVisible,
    guideTargetIndex,
    completeGuide,
    handleHomeTourStart,
    handleHomeTourExplore,
    handleImageNetworkReady
  };
}
