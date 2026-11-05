import { aiUILinkScheme } from './AIUIHelpers';

/**
 * Decides what a reply's UI loads for an image, video or sound the agent linked to: the address
 * to load, which may be another, or `null` not to load it. The agent writes these links, so one
 * could track the person or reach their network. The counterpart of `mediaURL` in StreamChatAI.
 */
export type AIUIMediaURL = (url: string) => string | null | undefined;

// A host on this device or its network, as a link names it.
const PRIVATE_HOST =
  /^(localhost|.*\.localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[(::1?|f[cd][0-9a-f]*:.*|fe[89ab][0-9a-f]*:.*|::ffff:.*)\])$/i;

// The host of a web link, past any user info and before its port: `//user@host:443/path`.
const HOST = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?(\[[^\]/?#]*\]|[^:/?#]*)/i;

/**
 * Whether `url` is a public web link: http or https, to a host that isn't this device or its
 * network, such as `localhost` or `192.168.1.1`.
 */
export const isPublicWebURL = (url: string) => {
  const scheme = aiUILinkScheme(url);
  if (scheme !== 'http' && scheme !== 'https') return false;
  const host = HOST.exec(url.trim())?.[1]?.replace(/\.$/, '');
  return !!host && !PRIVATE_HOST.test(host);
};

/**
 * The media a reply's UI loads by default: public web links. Others, such as `data:` or `file:`
 * URLs, or addresses on the person's network, don't load.
 */
export const aiUIPublicMediaURL: AIUIMediaURL = (url) => (isPublicWebURL(url) ? url : null);

/**
 * The address to load for a link the agent wrote, as `mediaURL` decides it, or `undefined` not to
 * load anything. Renderers call it before they draw an image, video or sound.
 */
export const aiUIMediaSource = (
  value: unknown,
  mediaURL: AIUIMediaURL = aiUIPublicMediaURL,
): string | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const decided = mediaURL(value.trim());
  return typeof decided === 'string' && decided.trim() !== '' ? decided : undefined;
};
