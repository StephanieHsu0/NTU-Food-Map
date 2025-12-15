import type { OAuthConfig, OAuthUserConfig } from '@auth/core/providers';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export default function LineProvider(
  options: OAuthUserConfig<LineProfile>
): OAuthConfig<LineProfile> {
  return {
    id: 'line',
    name: 'Line',
    type: 'oauth',
    authorization: {
      url: 'https://access.line.me/oauth2/v2.1/authorize',
      params: {
        scope: 'profile openid email',
        response_type: 'code',
      },
    },
    token: 'https://api.line.me/oauth2/v2.1/token',
    userinfo: 'https://api.line.me/v2/profile',
    client: {
      id: options.clientId!,
      secret: options.clientSecret!,
    },
    async profile(profile) {
      return {
        id: profile.userId,
        name: profile.displayName,
        email: null, // Line doesn't provide email by default
        image: profile.pictureUrl,
      };
    },
    style: {
      logo: 'https://developers.line.biz/media/line-login/line-logo.svg',
      bg: '#00C300',
      text: '#fff',
    },
  };
}
