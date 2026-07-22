import { computed, watch, type Ref } from 'vue';
import type { usePageUserTour } from './usePageUserTour';
import type { UserTourStep } from './useUserTour';

type PageUserTour = ReturnType<typeof usePageUserTour>;
type MoodboardTourController = Pick<
  PageUserTour,
  'state' | 'showStep' | 'pause' | 'advance' | 'completeChapter'
>;

const MOODBOARD_TOUR_STEPS: ReadonlySet<UserTourStep> = new Set([
  'moodboard-images',
  'moodboard-directory',
  'moodboard-orbit',
  'moodboard-folder',
  'moodboard-filters',
  'moodboard-tour-control'
]);

interface MoodboardTourFlowOptions {
  coreTour: MoodboardTourController;
  folders: Readonly<Ref<ReadonlyArray<{ images: readonly unknown[] }>>>;
  status: Readonly<Ref<string>>;
  isEmpty: Readonly<Ref<boolean>>;
  hasFolders: Ref<boolean>;
  previewFolder: (index: number) => void;
  goHome: () => void;
}

export function useMoodboardTourFlow(options: MoodboardTourFlowOptions) {
  const { coreTour, folders, status, isEmpty, hasFolders, previewFolder, goHome } = options;
  const isOrbitActive = computed(
    () =>
      coreTour.state.value.status === 'active' &&
      coreTour.state.value.currentChapter === 'moodboard' &&
      coreTour.state.value.step === 'moodboard-orbit'
  );

  function showPreviousStep(): void {
    const previousSteps: Partial<Record<UserTourStep, UserTourStep>> = {
      'moodboard-directory': 'moodboard-images',
      'moodboard-orbit': 'moodboard-directory',
      'moodboard-folder': 'moodboard-orbit',
      'moodboard-filters': 'moodboard-folder',
      'moodboard-tour-control': 'moodboard-filters'
    };
    const currentStep = coreTour.state.value.step;
    const previousStep = currentStep ? previousSteps[currentStep] : undefined;
    if (!previousStep) return;

    if (currentStep === 'moodboard-filters') goHome();
    coreTour.advance(previousStep);
  }

  function showCurrentStep(): void {
    const { currentChapter, status: tourStatus, step } = coreTour.state.value;
    if (
      currentChapter !== 'moodboard' ||
      tourStatus !== 'active' ||
      !step ||
      !MOODBOARD_TOUR_STEPS.has(step) ||
      status.value !== 'success'
    ) {
      return;
    }

    if (isEmpty.value) {
      coreTour.pause();
      return;
    }

    if (step === 'moodboard-folder') {
      const folderIndex = folders.value.findIndex((folder) => folder.images.length > 0);
      if (folderIndex !== -1) previewFolder(folderIndex);
    }

    void coreTour.showStep(step, {
      onPrevious: showPreviousStep,
      onComplete:
        step === 'moodboard-tour-control'
          ? () => coreTour.completeChapter('moodboard')
          : undefined
    });
  }

  watch(
    [
      () => coreTour.state.value.status,
      () => coreTour.state.value.step,
      status,
      isEmpty,
      hasFolders
    ],
    showCurrentStep,
    { immediate: true, flush: 'post' }
  );

  return { isOrbitActive, showCurrentStep };
}
