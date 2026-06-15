import { createMockError } from '@/api/mockAdapter';
import type { ApiResponse } from '@/types/api';

export interface GoogleOAuthRequest {
  redirectPath?: string;
}

export interface GoogleOAuthStart {
  authUrl: string;
}

export async function startGoogleOAuthApi(
  _payload: GoogleOAuthRequest = {}
): Promise<ApiResponse<GoogleOAuthStart>> {
  throw createMockError({
    code: 'GOOGLE_OAUTH_NOT_READY',
    message: 'Google OAuth is not implemented in the MVP mock flow.',
    status: 501
  });
}
