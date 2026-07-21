import { describe, expect, it } from 'vitest';
import { USER_TOUR_STEPS } from '@/constants/userTour';

describe('Moodboard user tour steps', () => {
  it('keeps Previous navigation inside Chapter 2', () => {
    expect(USER_TOUR_STEPS['moodboard-images']?.previousStep).toBeUndefined();
    expect(USER_TOUR_STEPS['moodboard-directory']?.previousStep).toBe('moodboard-images');
    expect(USER_TOUR_STEPS['moodboard-orbit']?.previousStep).toBe('moodboard-directory');
    expect(USER_TOUR_STEPS['moodboard-folder']?.previousStep).toBe('moodboard-orbit');
    expect(USER_TOUR_STEPS['moodboard-filters']?.previousStep).toBe('moodboard-folder');
    expect(USER_TOUR_STEPS['moodboard-tour-control']?.previousStep).toBe('moodboard-filters');
  });

  it('uses mobile directory copy without hover instructions', () => {
    expect(USER_TOUR_STEPS['moodboard-directory']?.descriptionKey).toBe(
      'userTour.steps.moodboardDirectory.description'
    );
    expect(USER_TOUR_STEPS['moodboard-directory']?.mobileDescriptionKey).toBe(
      'userTour.steps.moodboardDirectory.mobileDescription'
    );
  });

  it('advances filters to a sixth completion step', () => {
    expect(USER_TOUR_STEPS['moodboard-filters']?.nextStep).toBe('moodboard-tour-control');
    expect(USER_TOUR_STEPS['moodboard-filters']?.completeTour).not.toBe(true);
    expect(USER_TOUR_STEPS['moodboard-tour-control']).toMatchObject({
      progress: 6,
      total: 6,
      completeTour: true
    });
  });

  it('allows interaction with the Moodboard orbit target', () => {
    expect(USER_TOUR_STEPS['moodboard-orbit']?.allowInteraction).toBe(true);
  });

  it('targets the orbit folder instead of the directory folder for F4', () => {
    expect(USER_TOUR_STEPS['moodboard-folder']?.selector).toBe(
      '[data-tour="moodboard-orbit-folder"]'
    );
  });
});
