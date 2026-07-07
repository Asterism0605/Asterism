import { beforeEach, describe, expect, it, vi } from 'vitest';

const order = vi.fn();
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const single = vi.fn();
const insertSelect = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select: insertSelect }));
const deleteEq = vi.fn();
const del = vi.fn(() => ({ eq: deleteEq }));
const from = vi.fn(() => ({ select, insert, delete: del }));

vi.mock('@/api/supabaseClient', () => ({
  getSupabase: () => ({ from })
}));

import {
  addMoodboardItem,
  createMoodboardFolder,
  deleteMoodboardFolder,
  fetchMoodboardFolders
} from '@/api/moodboard.api';

describe('moodboard.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the authenticated profile folders with nested items and images', async () => {
    order.mockResolvedValue({ data: [], error: null });

    await fetchMoodboardFolders('user-1');

    expect(from).toHaveBeenCalledWith('moodboard_folders');
    expect(select).toHaveBeenCalledWith(expect.stringContaining('moodboard_items'));
    expect(eq).toHaveBeenCalledWith('profile_id', 'user-1');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('creates a folder with client-generated fields required by the live schema', async () => {
    const row = {
      id: 'folder-1',
      profile_id: 'user-1',
      name: 'Studio',
      created_at: '2026-07-05T00:00:00.000Z',
      updated_at: '2026-07-05T00:00:00.000Z'
    };
    single.mockResolvedValue({ data: row, error: null });

    await createMoodboardFolder({ profileId: 'user-1', name: 'Studio' });

    expect(from).toHaveBeenCalledWith('moodboard_folders');
    expect(insert).toHaveBeenCalledWith({
      id: expect.any(String),
      profile_id: 'user-1',
      name: 'Studio',
      updated_at: expect.any(String)
    });
    expect(insertSelect).toHaveBeenCalledWith('id,profile_id,name,created_at,updated_at');
  });

  it('creates an item with the UUID required by the live schema', async () => {
    const row = {
      id: 'item-1',
      folder_id: 'folder-1',
      image_id: 'image-1',
      created_at: '2026-07-05T00:00:00.000Z'
    };
    single.mockResolvedValue({ data: row, error: null });

    await addMoodboardItem({ folderId: 'folder-1', imageId: 'image-1' });

    expect(from).toHaveBeenCalledWith('moodboard_items');
    expect(insert).toHaveBeenCalledWith({
      id: expect.any(String),
      folder_id: 'folder-1',
      image_id: 'image-1'
    });
  });

  it('propagates Data API errors instead of turning them into empty data', async () => {
    const error = { message: 'permission denied' };
    order.mockResolvedValue({ data: null, error });

    await expect(fetchMoodboardFolders('user-1')).rejects.toBe(error);
  });

  it('deletes a folder by id and relies on the DB cascade for its items', async () => {
    deleteEq.mockResolvedValue({ error: null });

    await deleteMoodboardFolder('folder-1');

    expect(from).toHaveBeenCalledWith('moodboard_folders');
    expect(del).toHaveBeenCalled();
    expect(deleteEq).toHaveBeenCalledWith('id', 'folder-1');
  });

  it('propagates folder delete errors', async () => {
    const error = { message: 'permission denied' };
    deleteEq.mockResolvedValue({ error });

    await expect(deleteMoodboardFolder('folder-1')).rejects.toBe(error);
  });
});
