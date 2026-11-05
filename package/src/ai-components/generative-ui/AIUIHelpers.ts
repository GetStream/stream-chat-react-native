// What the generated UI layer and its renderers share. Free of React and of any renderer's
// packages.

/** Whether `value` is a JSON object, rather than an array, `null` or a scalar. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Whether two JSON values hold the same. A message is a new object on every update while a reply
 * streams, so what it carries is compared by value.
 */
export const isSameJSON = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a)) {
    return (
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, index) => isSameJSON(item, b[index]))
    );
  }
  if (!isRecord(a) || !isRecord(b)) return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && isSameJSON(a[key], b[key]))
  );
};

/** How many bytes `text` takes as UTF-8, as the agent's backend counts it. */
export const utf8ByteLength = (text: string) => {
  let bytes = 0;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
      // A surrogate pair is one character of four bytes.
      bytes += 4;
      index++;
    } else bytes += 3;
  }
  return bytes;
};

/**
 * The type an app's component is placed by in a format's UI, such as `PlaceCard` for
 * `place_card`: named as A2UI's and OpenUI's own components are.
 */
export const aiUITypeName = (name: string) =>
  name
    .split(/[_\- ]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

/** `text` as a sentence, ending in a full stop unless it ends otherwise. */
export const aiUISentence = (text: string) => {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

// A link's scheme, then what follows it, with no whitespace in it.
const LINK = /^([A-Za-z][A-Za-z0-9+.-]*):(\S*)$/;

const hasControlCharacter = (text: string) => {
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
};

/**
 * The scheme of a link from a reply's UI, in lowercase, such as `https`, or `undefined` for text
 * that isn't one: no scheme, whitespace or control characters in it, or a web link with no host.
 * React Native's `URL` doesn't refuse what isn't a link, so it is read here.
 */
export const aiUILinkScheme = (link: string): string | undefined => {
  const trimmed = link.trim();
  const match = hasControlCharacter(trimmed) ? null : LINK.exec(trimmed);
  if (!match) return undefined;
  const scheme = match[1].toLowerCase();
  const rest = match[2];
  if ((scheme === 'http' || scheme === 'https') && !/^\/\/[^/?#]+/.test(rest)) return undefined;
  return scheme;
};
