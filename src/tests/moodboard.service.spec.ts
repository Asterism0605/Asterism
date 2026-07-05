import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MoodboardFolder } from '@/types/moodboard';

const { addMoodboardItem, createMoodboardFolder, fetchMoodboardFolders } = vi.hoisted(() => ({
  addMoodboardItem: vi.fn(),
  createMoodboardFolder: vi.fn(),
  fetchMoodboardFolders: vi.fn()
}));

vi.mock('@/api/moodboard.api', () => ({
  addMoodboardItem,
  createMoodboardFolder,
  fetchMoodboardFolders
}));

vi.mock('@/services/image.service', () => ({
  getImageById: (id: string) => ({
    id,
    src: `/style-image/${id}.webp`,
    title: `Image ${id}`,
    styleGroup: 'minimal',
    style: ['Minimalism']
  })
}));

import {
  addItem,
  createFolder,
  getMoodboardViewModel,
  isImageSaved
} from '@/services/moodboard.service';

const existingFolders: MoodboardFolder[] = [];

describe('moodboard.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps nested Data API rows into the existing UI view model', async () => {
    fetchMoodboardFolders.mockResolvedValue([
      {
        id: 'folder-1',
        profile_id: 'user-1',
        name: 'Studio',
        created_at: '2026-07-05T00:00:00.000Z',
        updated_at: '2026-07-05T00:00:00.000Z',
        moodboard_items: [
          {
            id: 'item-1',
            folder_id: 'folder-1',
            image_id: 'image-1',
            created_at: '2026-07-05T00:00:00.000Z',
            images: {
              id: 'image-1',
              url: '/image-1.webp',
              title: 'Image 1',
              style_group: 'minimal',
              style: ['Minimalism']
            }
          }
        ]
      }
    ]);

    const viewModel = await getMoodboardViewModel('user-1');

    expect(viewModel.totalFolderCount).toBe(1);
    expect(viewModel.totalSavedItemCount).toBe(1);
    expect(viewModel.folders[0].images[0]).toMatchObject({
      itemId: 'item-1',
      id: 'image-1',
      src: '/image-1.webp',
      styleGroup: 'minimal'
    });
  });

  it('creates a trimmed folder through the Data API', async () => {
    createMoodboardFolder.mockResolvedValue({
      id: 'folder-1',
      profile_id: 'user-1',
      name: 'Studio',
      created_at: '2026-07-05T00:00:00.000Z',
      updated_at: '2026-07-05T00:00:00.000Z'
    });

    const result = await createFolder('user-1', '  Studio  ', existingFolders);

    expect(createMoodboardFolder).toHaveBeenCalledWith({
      profileId: 'user-1',
      name: 'Studio'
    });
    expect(result).toEqual({
      id: 'folder-1',
      name: 'Studio',
      createdAt: '2026-07-05T00:00:00.000Z',
      images: []
    });
  });

  it('rejects duplicate folder names before writing', async () => {
    const folders = [
      {
        id: 'folder-1',
        name: 'Studio',
        createdAt: '2026-07-05T00:00:00.000Z',
        images: []
      }
    ];

    await expect(createFolder('user-1', ' Studio ', folders)).rejects.toThrow(
      'A folder with this name already exists.'
    );
    expect(createMoodboardFolder).not.toHaveBeenCalled();
  });

  it('adds an image through the Data API and returns an immediate UI item', async () => {
    addMoodboardItem.mockResolvedValue({
      id: 'item-1',
      folder_id: 'folder-1',
      image_id: 'image-1',
      created_at: '2026-07-05T00:00:00.000Z'
    });

    const item = await addItem('folder-1', 'image-1');

    expect(addMoodboardItem).toHaveBeenCalledWith({
      folderId: 'folder-1',
      imageId: 'image-1'
    });
    expect(item).toMatchObject({
      itemId: 'item-1',
      id: 'image-1',
      src: '/style-image/image-1.webp'
    });
  });

  it('checks saved state from the passed store snapshot', () => {
    const folders = [
      {
        id: 'folder-1',
        name: 'Studio',
        createdAt: '2026-07-05T00:00:00.000Z',
        images: [
          {
            itemId: 'item-1',
            id: 'image-1',
            src: '/image-1.webp',
            title: 'Image 1',
            styleGroup: 'minimal',
            style: [],
            createdAt: '2026-07-05T00:00:00.000Z'
          }
        ]
      }
    ];

    expect(isImageSaved(folders, 'image-1')).toBe(true);
    expect(isImageSaved(folders, 'image-2')).toBe(false);
  });
});
