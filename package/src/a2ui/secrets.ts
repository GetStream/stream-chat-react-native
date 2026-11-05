import { isRecord } from '../ai-components/generative-ui/AIUIHelpers';

// A secret this short is left alone inside longer text, which would otherwise lose every word that
// happens to contain it. Text that is only the secret goes all the same.
const SHORTEST_SECRET_IN_TEXT = 4;

// Whether `value` holds one of `secrets`: is one, or is text written with one.
const holdsSecret = (value: string, secrets: string[]) =>
  secrets.some(
    (secret) =>
      value === secret || (secret.length >= SHORTEST_SECRET_IN_TEXT && value.includes(secret)),
  );

/**
 * `value` without what holds one of `secrets`, such as what the person typed into an obscured
 * TextField: an entry of an object or a list that holds one is left out. An action's context and
 * a surface's data model go to the agent, which must never see a password.
 */
export const withoutSecrets = (value: unknown, secrets: string[]): unknown => {
  if (secrets.length === 0) return value;
  if (Array.isArray(value)) {
    return value
      .filter((item) => !(typeof item === 'string' && holdsSecret(item, secrets)))
      .map((item) => withoutSecrets(item, secrets));
  }
  if (!isRecord(value)) return value;
  const kept: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' && holdsSecret(item, secrets)) continue;
    kept[key] = withoutSecrets(item, secrets);
  }
  return kept;
};

const unescape = (segment: string) => segment.replace(/~1/g, '/').replace(/~0/g, '~');

/** `value` without what is at each of `paths`, JSON Pointers such as `/account/password`. */
export const withoutPaths = (value: unknown, paths: Iterable<string>): unknown => {
  let result = value;
  for (const path of paths) {
    const segments = path.split('/').slice(1).map(unescape);
    if (segments.length === 0) return undefined;
    const remove = (node: unknown, index: number): unknown => {
      const key = segments[index];
      const last = index === segments.length - 1;
      if (Array.isArray(node)) {
        const at = Number(key);
        if (!Number.isInteger(at) || at < 0 || at >= node.length) return node;
        return last
          ? node.filter((_, position) => position !== at)
          : node.map((item, position) => (position === at ? remove(item, index + 1) : item));
      }
      if (!isRecord(node) || !(key in node)) return node;
      if (last) {
        const { [key]: _removed, ...rest } = node;
        return rest;
      }
      return { ...node, [key]: remove(node[key], index + 1) };
    };
    result = remove(result, 0);
  }
  return result;
};
