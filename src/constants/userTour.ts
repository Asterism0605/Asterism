import type { Alignment, Side } from 'driver.js';
import type { UserTourStep } from '@/composables/guide/useUserTour';

export const GUIDE_STORAGE_KEY = 'asterism:guide:home-image-click';
export { HOME_HERO_IMAGE_INDEX as GUIDE_TARGET_INDEX } from '@/components/sections/FloatingImageNetwork/config';
export const TOOLTIP_GAP = 32;
export const VIEWPORT_MARGIN = 16;
export const TOOLTIP_SPACE_THRESHOLD = 48;

export interface UserTourStepDefinition {
  selector: string;
  titleKey: string;
  descriptionKey: string;
  mobileDescriptionKey?: string;
  progress: number;
  total?: number;
  previousStep?: UserTourStep;
  nextStep?: UserTourStep;
  completeTour?: boolean;
  side?: Side;
  align?: Alignment;
  allowInteraction?: boolean;
  multiTargetSelector?: string;
  centerPopover?: boolean;
}

export const USER_TOUR_STEP_COUNT = 8;

export const USER_TOUR_STEPS: Partial<Record<UserTourStep, UserTourStepDefinition>> = {
  'home-overview': {
    selector: '[data-tour="home-overview"]',
    titleKey: 'userTour.steps.homeOverview.title',
    descriptionKey: 'userTour.steps.homeOverview.description',
    progress: 1,
    nextStep: 'home-image'
  },
  'home-image': {
    selector: '[data-tour="home-image"]',
    titleKey: 'userTour.steps.homeImage.title',
    descriptionKey: 'userTour.steps.homeImage.description',
    progress: 2,
    previousStep: 'home-overview',
    allowInteraction: true
  },
  'spread-related-group': {
    selector: '[data-tour-medium-label]',
    titleKey: 'userTour.steps.spreadRelatedGroup.title',
    descriptionKey: 'userTour.steps.spreadRelatedGroup.description',
    progress: 3,
    previousStep: 'home-image',
    nextStep: 'spread-related-image',
    multiTargetSelector: '[data-tour-medium-label]',
    centerPopover: true
  },
  'spread-related-image': {
    selector: '[data-tour="spread-related-image"]',
    titleKey: 'userTour.steps.spreadRelatedImage.title',
    descriptionKey: 'userTour.steps.spreadRelatedImage.description',
    progress: 4,
    previousStep: 'spread-related-group',
    allowInteraction: true
  },
  'detail-thumbnail': {
    selector: '[data-tour="detail-thumbnail"]',
    titleKey: 'userTour.steps.detailThumbnail.title',
    descriptionKey: 'userTour.steps.detailThumbnail.description',
    progress: 5,
    previousStep: 'spread-related-image',
    allowInteraction: true,
    side: 'right',
    align: 'center'
  },
  'detail-style-tag': {
    selector: '[data-tour="detail-style-tag"]',
    titleKey: 'userTour.steps.detailStyleTag.title',
    descriptionKey: 'userTour.steps.detailStyleTag.description',
    progress: 6,
    previousStep: 'detail-thumbnail',
    allowInteraction: true,
    side: 'left',
    align: 'center'
  },
  'detail-consult': {
    selector: '[data-tour="detail-consult"]',
    titleKey: 'userTour.steps.detailConsult.title',
    descriptionKey: 'userTour.steps.detailConsult.description',
    progress: 7,
    previousStep: 'detail-style-tag',
    nextStep: 'detail-save',
    side: 'left',
    align: 'center'
  },
  'detail-save': {
    selector: '[data-tour="detail-save"]',
    titleKey: 'userTour.steps.detailSave.title',
    descriptionKey: 'userTour.steps.detailSave.description',
    progress: 8,
    previousStep: 'detail-consult',
    allowInteraction: true,
    side: 'left',
    align: 'center'
  },
  'moodboard-images': {
    selector: '[data-tour="moodboard-images"]',
    titleKey: 'userTour.steps.moodboardImages.title',
    descriptionKey: 'userTour.steps.moodboardImages.description',
    progress: 1,
    total: 6,
    nextStep: 'moodboard-directory',
    side: 'left',
    align: 'center'
  },
  'moodboard-directory': {
    selector: '[data-tour="moodboard-directory"]',
    titleKey: 'userTour.steps.moodboardDirectory.title',
    descriptionKey: 'userTour.steps.moodboardDirectory.description',
    mobileDescriptionKey: 'userTour.steps.moodboardDirectory.mobileDescription',
    progress: 2,
    total: 6,
    previousStep: 'moodboard-images',
    nextStep: 'moodboard-orbit',
    side: 'right',
    align: 'start'
  },
  'moodboard-orbit': {
    selector: '[data-tour="moodboard-orbit"]',
    titleKey: 'userTour.steps.moodboardOrbit.title',
    descriptionKey: 'userTour.steps.moodboardOrbit.description',
    progress: 3,
    total: 6,
    previousStep: 'moodboard-directory',
    nextStep: 'moodboard-folder',
    allowInteraction: true,
    side: 'top',
    align: 'center'
  },
  'moodboard-folder': {
    selector: '[data-tour="moodboard-folder"]',
    titleKey: 'userTour.steps.moodboardFolder.title',
    descriptionKey: 'userTour.steps.moodboardFolder.description',
    progress: 4,
    total: 6,
    previousStep: 'moodboard-orbit',
    allowInteraction: true,
    side: 'bottom',
    align: 'center'
  },
  'moodboard-filters': {
    selector: '[data-tour="moodboard-filters"]',
    titleKey: 'userTour.steps.moodboardFilters.title',
    descriptionKey: 'userTour.steps.moodboardFilters.description',
    progress: 5,
    total: 6,
    previousStep: 'moodboard-folder',
    nextStep: 'moodboard-tour-control',
    side: 'top',
    align: 'center'
  },
  'moodboard-tour-control': {
    selector: '[data-tour="moodboard-tour-control"]',
    titleKey: 'userTour.steps.moodboardTourControl.title',
    descriptionKey: 'userTour.steps.moodboardTourControl.description',
    progress: 6,
    total: 6,
    previousStep: 'moodboard-filters',
    completeTour: true,
    side: 'bottom',
    align: 'end'
  }
};
