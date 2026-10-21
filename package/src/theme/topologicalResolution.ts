import { Theme } from '../contexts';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && value.constructor === Object;
};

/**
 * Resolves `$token` references in `dictionary` depth first, dependencies before the token that uses
 * them, so declaration order does not matter. Throws on a cycle or an unresolved reference.
 *
 * @param dictionary The semantic tokens, whose values may reference other tokens as `$token`.
 * @returns The dictionary with every reference resolved.
 */
export const resolveTokensTopologically = <T extends Theme['semantics']>(dictionary: T): T => {
  const resolvedMemo = new Map<string, unknown>();

  // Cycle detection: none are expected, but a cycle must fail loudly.
  const visiting = new Set<string>();

  const resolveValueDeep = (value: unknown): unknown => {
    if (typeof value === 'string' && value.startsWith('$')) {
      return dfs(value.slice(1), value);
    }

    if (Array.isArray(value)) return value.map(resolveValueDeep);

    if (isPlainObject(value)) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) out[k] = resolveValueDeep(v);
      return out;
    }

    return value;
  };

  /** Resolves a token's dependencies first, then memoizes the token. */
  const dfs = (tokenKeyOrPath: string, originalRef: string): unknown => {
    const cacheKey = tokenKeyOrPath;

    if (resolvedMemo.has(cacheKey)) return resolvedMemo.get(cacheKey);

    if (visiting.has(cacheKey)) {
      throw new Error(`Cycle detected while topo-evaluating "${originalRef}" (at "${cacheKey}")`);
    }

    visiting.add(cacheKey);

    const raw = dictionary[tokenKeyOrPath as keyof Theme['semantics']];

    if (raw === undefined) {
      throw new Error(`Unresolved reference: "${originalRef}" (missing "${tokenKeyOrPath}")`);
    }

    // Dependencies resolve before the token is memoized, so a cycle or a missing reference throws.
    const fullyResolved = resolveValueDeep(raw);

    resolvedMemo.set(cacheKey, fullyResolved);
    visiting.delete(cacheKey);

    return fullyResolved;
  };

  return resolveValueDeep(dictionary) as T;
};
