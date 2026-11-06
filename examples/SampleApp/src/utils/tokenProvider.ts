import type { TokenOrProvider, TokenProvider } from 'stream-chat';

import AsyncStore from './AsyncStore';

import type { LoginConfig } from '../types';

export const SAMPLE_APP_API_KEY = 'yjrt5yxw77ev';

/**
 * Pronto's token generator — the same one stream-chat-react's vite example uses — scoped to the
 * SampleApp's app via `environment`. It signs tokens for {@link SAMPLE_APP_API_KEY} only; a custom
 * app needs its own generator URL or a static token.
 */
export const DEFAULT_TOKEN_URL =
  'https://pronto.getstream.io/api/auth/create-token?environment=react-native-chat-sample';

/**
 * Appends `user_id` by hand rather than through `URL.searchParams`: React Native's `URL` polyfill
 * builds a fresh `URLSearchParams` on every `searchParams` read, so a `set()` on it never reaches
 * `toString()`.
 */
const buildTokenRequestUrl = (tokenUrl: string, userId: string) =>
  `${tokenUrl}${tokenUrl.includes('?') ? '&' : '?'}user_id=${encodeURIComponent(userId)}`;

const lastTokenKey = (userId: string) => `@stream-rn-sampleapp-last-token-${userId}`;

export const clearLastToken = (userId: string) => AsyncStore.removeItem(lastTokenKey(userId));

export const createTokenProvider =
  (tokenUrl: string, userId: string): TokenProvider =>
  async () => {
    let response: Response;
    try {
      response = await fetch(buildTokenRequestUrl(tokenUrl, userId));
    } catch (error) {
      // Offline the request fails before any response. The user's last token lets the client start
      // from its offline data and reconnect when the network is back, which fetches a fresh one.
      const lastToken = await AsyncStore.getItem<string | null>(lastTokenKey(userId), null);
      if (lastToken) return lastToken;
      throw error;
    }
    if (!response.ok) {
      throw new Error(`Token generator responded with ${response.status}`);
    }
    const { token } = (await response.json()) as { token?: string };
    if (!token) {
      throw new Error('Token generator response did not contain a token');
    }
    await AsyncStore.setItem(lastTokenKey(userId), token);
    return token;
  };

/** A static token wins when one is provided; otherwise tokens come from the generator. */
export const getTokenOrProvider = ({ tokenUrl, userId, userToken }: LoginConfig): TokenOrProvider =>
  userToken || createTokenProvider(tokenUrl || DEFAULT_TOKEN_URL, userId);
