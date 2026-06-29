import { getSupabase } from '@/api/supabaseClient';
import type { ComputedStyleDnaResult } from '@/utils/computeStyleDnaResult';

export type ProfileOnboardingStatus = 'not_started' | 'dna_pending' | 'completed';

export interface StyleDnaProfileRow {
  style_dna_result: unknown;
}

export async function fetchStyleDnaProfileRow(
  userId: string
): Promise<StyleDnaProfileRow | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('style_dna_result')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }

    throw error;
  }

  return data as StyleDnaProfileRow | null;
}

export async function updateStyleDnaProfileRow(
  userId: string,
  result: ComputedStyleDnaResult
): Promise<void> {
  const { error } = await getSupabase()
    .from('profiles')
    .update({
      style_dna_result: result,
      onboarding_status: 'completed'
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}
