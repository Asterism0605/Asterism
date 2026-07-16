import { i18n } from '@/i18n';
import { IMAGE_SEARCH_CONFIG } from '@/config/imageSearch.config';

export function validateImageFile(file: File): string | null {
  if (!IMAGE_SEARCH_CONFIG.allowedFileTypes.includes(file.type)) {
    return i18n.global.t('imageSearch.invalidFileType');
  }

  if (file.size > IMAGE_SEARCH_CONFIG.maxFileSizeBytes) {
    return i18n.global.t('imageSearch.fileTooLarge');
  }

  if (file.size === 0) {
    return i18n.global.t('imageSearch.invalidFileType');
  }

  return null;
}

export function meetsSimilarityThreshold(similarity: number): boolean {
  return similarity >= IMAGE_SEARCH_CONFIG.similarityThreshold;
}
