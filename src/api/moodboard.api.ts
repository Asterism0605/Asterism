import { getSupabase } from '@/api/supabaseClient';

export interface MoodboardImageRow {
  id: string;
  url: string;
  title: string;
  style_group: string;
  style: string[] | null;
  medium: string | null;
}

export interface MoodboardItemRow {
  id: string;
  folder_id: string;
  image_id: string;
  created_at: string;
  images: MoodboardImageRow | MoodboardImageRow[] | null;
}

export interface MoodboardFolderRow {
  id: string;
  profile_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  moodboard_items: MoodboardItemRow[];
}

export interface CreateMoodboardFolderInput {
  profileId: string;
  name: string;
}

export interface AddMoodboardItemInput {
  folderId: string;
  imageId: string;
}

export interface DeleteMoodboardItemInput {
  itemId: string;
  folderId: string;
}

const MOODBOARD_FOLDER_SELECT = `
  id,
  profile_id,
  name,
  created_at,
  updated_at,
  moodboard_items (
    id,
    folder_id,
    image_id,
    created_at,
    images (
      id,
      url,
      title,
      style_group,
      style,
      medium
    )
  )
`;

export async function fetchMoodboardFolders(profileId: string): Promise<MoodboardFolderRow[]> {
  const { data, error } = await getSupabase()
    .from('moodboard_folders')
    .select(MOODBOARD_FOLDER_SELECT)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as MoodboardFolderRow[];
}

export async function createMoodboardFolder(
  input: CreateMoodboardFolderInput
): Promise<Omit<MoodboardFolderRow, 'moodboard_items'>> {
  const { data, error } = await getSupabase()
    .from('moodboard_folders')
    .insert({
      id: crypto.randomUUID(),
      profile_id: input.profileId,
      name: input.name,
      updated_at: new Date().toISOString()
    })
    .select('id,profile_id,name,created_at,updated_at')
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Moodboard folder was not returned after insert.');
  }

  return data as Omit<MoodboardFolderRow, 'moodboard_items'>;
}

export async function deleteMoodboardFolder(
  folderId: string,
  profileId: string
): Promise<void> {
  const { data, error } = await getSupabase()
    .from('moodboard_folders')
    .delete()
    .eq('id', folderId)
    .eq('profile_id', profileId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Moodboard folder was not deleted.');
  }
}

export async function addMoodboardItem(
  input: AddMoodboardItemInput
): Promise<Omit<MoodboardItemRow, 'images'>> {
  const { data, error } = await getSupabase()
    .from('moodboard_items')
    .insert({
      id: crypto.randomUUID(),
      folder_id: input.folderId,
      image_id: input.imageId
    })
    .select('id,folder_id,image_id,created_at')
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Moodboard item was not returned after insert.');
  }

  return data as Omit<MoodboardItemRow, 'images'>;
}

// 不像 deleteMoodboardFolder 那樣過濾 profile_id：item 的 ownership 是透過
// folder_id 關聯到 moodboard_folders.profile_id，交給 Supabase RLS policy 擋非本人操作。
export async function deleteMoodboardItem({
  itemId,
  folderId
}: DeleteMoodboardItemInput): Promise<void> {
  const { data, error } = await getSupabase()
    .from('moodboard_items')
    .delete()
    .eq('id', itemId)
    .eq('folder_id', folderId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Moodboard item was not deleted.');
  }
}
