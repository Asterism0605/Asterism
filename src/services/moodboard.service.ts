import {
  addMoodboardItem,
  countMoodboardItems,
  createMoodboardFolder,
  deleteMoodboardFolder,
  deleteMoodboardItem,
  fetchMoodboardFolders,
  type MoodboardFolderRow,
  type MoodboardItemRow
} from '@/api/moodboard.api';
import { getImageById } from '@/services/image.service';
import {
  MOODBOARD_FOLDER_IMAGE_MAX,
  MOODBOARD_FOLDER_NAME_MAX_LENGTH
} from '@/constants/moodboard.constants';
import { graphemeLength } from '@/utils/graphemeLength';
import type {
  MoodboardFolder,
  MoodboardViewModel,
  SavedImage
} from '@/types/moodboard';

const MAX_FOLDERS = 10;

function toSavedImage(row: MoodboardItemRow): SavedImage | null {
  const image = Array.isArray(row.images) ? row.images[0] : row.images;

  if (!image) {
    return null;
  }

  return {
    itemId: row.id,
    id: row.image_id,
    src: image.url,
    title: image.title,
    styleGroup: image.style_group,
    style: image.style ?? [],
    createdAt: row.created_at
  };
}

function toMoodboardFolder(row: MoodboardFolderRow): MoodboardFolder {
  const seen = new Set<string>();
  const images = row.moodboard_items
    .map(toSavedImage)
    .filter((image): image is SavedImage => image !== null)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .filter((image) => {
      if (seen.has(image.id)) return false;
      seen.add(image.id);
      return true;
    });

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    images
  };
}

export async function getMoodboardViewModel(profileId: string): Promise<MoodboardViewModel> {
  const rows = await fetchMoodboardFolders(profileId);
  const folders = rows.map(toMoodboardFolder);
  const allItems = folders.flatMap((folder) => folder.images);

  return {
    folders,
    allItems,
    totalFolderCount: folders.length,
    totalSavedItemCount: allItems.length
  };
}

export async function createFolder(
  profileId: string,
  name: string,
  folders: MoodboardFolder[]
): Promise<MoodboardFolder> {
  const normalizedName = name.trim();

  if (graphemeLength(normalizedName) > MOODBOARD_FOLDER_NAME_MAX_LENGTH) {
    throw new Error(`Folder name must be ${MOODBOARD_FOLDER_NAME_MAX_LENGTH} characters or fewer.`);
  }

  if (folders.length >= MAX_FOLDERS) {
    throw new Error('You have reached the maximum of 10 folders.');
  }

  if (folders.some((folder) => folder.name.trim() === normalizedName)) {
    throw new Error('A folder with this name already exists.');
  }

  const row = await createMoodboardFolder({
    profileId,
    name: normalizedName
  });

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    images: []
  };
}

export async function deleteFolder(folderId: string, profileId: string): Promise<void> {
  await deleteMoodboardFolder(folderId, profileId);
}

export async function deleteItem({
  folderId,
  itemId
}: {
  folderId: string;
  itemId: string;
}): Promise<void> {
  await deleteMoodboardItem({ itemId, folderId });
}

export async function addItem(folderId: string, imageId: string): Promise<SavedImage> {
  const image = getImageById(imageId);

  if (!image) {
    throw new Error('Image not found.');
  }

  const currentCount = await countMoodboardItems(folderId);

  if (currentCount >= MOODBOARD_FOLDER_IMAGE_MAX) {
    throw new Error(`Each folder can hold up to ${MOODBOARD_FOLDER_IMAGE_MAX} images.`);
  }

  const row = await addMoodboardItem({ folderId, imageId });

  return {
    itemId: row.id,
    id: imageId,
    src: image.src,
    title: image.title,
    styleGroup: image.styleGroup,
    style: image.style,
    createdAt: row.created_at
  };
}

export function isImageSaved(folders: MoodboardFolder[], imageId: string): boolean {
  return folders.some((folder) => folder.images.some((image) => image.id === imageId));
}
