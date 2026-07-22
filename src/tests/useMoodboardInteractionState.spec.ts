import { describe, expect, it } from 'vitest';
import { useMoodboardInteractionState } from '@/composables/useMoodboardInteractionState';

describe('useMoodboardInteractionState', () => {
  it('starts idle with no delete mode, no select mode, no selected images', () => {
    const state = useMoodboardInteractionState(() => []);

    expect(state.isFolderDeleteMode.value).toBe(false);
    expect(state.isImageSelectMode.value).toBe(false);
    expect(state.selectedImageIds.value.size).toBe(0);
  });

  it('toggles folder delete mode on and off', () => {
    const state = useMoodboardInteractionState(() => []);

    state.toggleFolderDeleteMode();
    expect(state.isFolderDeleteMode.value).toBe(true);

    state.toggleFolderDeleteMode();
    expect(state.isFolderDeleteMode.value).toBe(false);
  });

  it('toggles image select mode and clears selection when leaving it', () => {
    const state = useMoodboardInteractionState(() => ['a', 'b']);

    state.toggleImageSelectMode();
    expect(state.isImageSelectMode.value).toBe(true);

    state.toggleImageSelection('a');
    expect(state.selectedImageIds.value.has('a')).toBe(true);

    state.toggleImageSelectMode();
    expect(state.isImageSelectMode.value).toBe(false);
    expect(state.selectedImageIds.value.size).toBe(0);
  });

  it('folder delete mode and image select mode are mutually exclusive', () => {
    const state = useMoodboardInteractionState(() => []);

    state.toggleImageSelectMode();
    expect(state.isImageSelectMode.value).toBe(true);

    state.toggleFolderDeleteMode();
    expect(state.isFolderDeleteMode.value).toBe(true);
    expect(state.isImageSelectMode.value).toBe(false);
  });

  it('ignores toggleImageSelection outside image select mode', () => {
    const state = useMoodboardInteractionState(() => ['a']);

    state.toggleImageSelection('a');

    expect(state.selectedImageIds.value.size).toBe(0);
  });

  it('computes isAllImagesSelected against the selectable image ids', () => {
    const state = useMoodboardInteractionState(() => ['a', 'b']);
    state.toggleImageSelectMode();

    expect(state.isAllImagesSelected.value).toBe(false);

    state.toggleImageSelection('a');
    state.toggleImageSelection('b');
    expect(state.isAllImagesSelected.value).toBe(true);
  });

  it('toggleSelectAllImages selects all then clears on next call', () => {
    const state = useMoodboardInteractionState(() => ['a', 'b']);
    state.toggleImageSelectMode();

    state.toggleSelectAllImages();
    expect(state.selectedImageIds.value.size).toBe(2);

    state.toggleSelectAllImages();
    expect(state.selectedImageIds.value.size).toBe(0);
  });

  it('resetImageSelection only clears image select mode, leaving folder delete mode untouched', () => {
    const state = useMoodboardInteractionState(() => []);

    state.toggleFolderDeleteMode();
    state.resetImageSelection();

    expect(state.isFolderDeleteMode.value).toBe(true);
  });

  it('resetInteractionState clears either mode back to idle', () => {
    const state = useMoodboardInteractionState(() => []);

    state.toggleFolderDeleteMode();
    state.resetInteractionState();
    expect(state.isFolderDeleteMode.value).toBe(false);

    state.toggleImageSelectMode();
    state.toggleImageSelection('a');
    state.resetInteractionState();
    expect(state.isImageSelectMode.value).toBe(false);
    expect(state.selectedImageIds.value.size).toBe(0);
  });
});
