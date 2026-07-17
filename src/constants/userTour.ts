import type { Alignment, Side } from 'driver.js';
import type { UserTourStep } from '@/composables/guide/useUserTour';

export const GUIDE_STORAGE_KEY = 'asterism:guide:home-image-click';
export { HOME_HERO_IMAGE_INDEX as GUIDE_TARGET_INDEX } from '@/components/sections/FloatingImageNetwork/config';
export const TOOLTIP_GAP = 32;
export const VIEWPORT_MARGIN = 16;
export const TOOLTIP_SPACE_THRESHOLD = 48;

interface UserTourStepDefinition {
  selector: string;
  sectionKey: string;
  titleKey: string;
  descriptionKey: string;
  progress: number;
  nextStep?: UserTourStep;
  side?: Side;
  align?: Alignment;
  allowInteraction?: boolean;
}

export const USER_TOUR_STEP_COUNT = 8;

export const USER_TOUR_STEPS: Partial<Record<UserTourStep, UserTourStepDefinition>> = {
  'home-overview': {
    selector: '[data-tour="home-overview"]',
    sectionKey: 'userTour.sections.home',
    titleKey: 'userTour.steps.homeOverview.title',
    descriptionKey: 'userTour.steps.homeOverview.description',
    progress: 1,
    nextStep: 'home-image'
  },
  'home-image': {
    selector: '[data-tour="home-image"]',
    sectionKey: 'userTour.sections.home',
    titleKey: 'userTour.steps.homeImage.title',
    descriptionKey: 'userTour.steps.homeImage.description',
    progress: 2,
    allowInteraction: true
  },
  'spread-center': {
    selector: '[data-tour="spread-center"]',
    sectionKey: 'userTour.sections.imageSpread',
    titleKey: 'userTour.steps.spreadCenter.title',
    descriptionKey: 'userTour.steps.spreadCenter.description',
    progress: 3,
    nextStep: 'spread-related-group',
    side: 'right',
    align: 'center'
  },
  'spread-related-group': {
    selector: '[data-tour="spread-related-group"]',
    sectionKey: 'userTour.sections.imageSpread',
    titleKey: 'userTour.steps.spreadRelatedGroup.title',
    descriptionKey: 'userTour.steps.spreadRelatedGroup.description',
    progress: 4,
    nextStep: 'spread-related-image'
  },
  'spread-related-image': {
    selector: '[data-tour="spread-related-image"]',
    sectionKey: 'userTour.sections.imageSpread',
    titleKey: 'userTour.steps.spreadRelatedImage.title',
    descriptionKey: 'userTour.steps.spreadRelatedImage.description',
    progress: 5,
    allowInteraction: true
  },
  'detail-thumbnail': {
    selector: '[data-tour="detail-thumbnail"]',
    sectionKey: 'userTour.sections.pictureDetail',
    titleKey: 'userTour.steps.detailThumbnail.title',
    descriptionKey: 'userTour.steps.detailThumbnail.description',
    progress: 6,
    allowInteraction: true,
    side: 'right',
    align: 'center'
  },
  'detail-style-tag': {
    selector: '[data-tour="detail-style-tag"]',
    sectionKey: 'userTour.sections.pictureDetail',
    titleKey: 'userTour.steps.detailStyleTag.title',
    descriptionKey: 'userTour.steps.detailStyleTag.description',
    progress: 7,
    allowInteraction: true,
    side: 'left',
    align: 'center'
  },
  'detail-save': {
    selector: '[data-tour="detail-save"]',
    sectionKey: 'userTour.sections.pictureDetail',
    titleKey: 'userTour.steps.detailSave.title',
    descriptionKey: 'userTour.steps.detailSave.description',
    progress: 8,
    allowInteraction: true,
    side: 'left',
    align: 'center'
  }
};
