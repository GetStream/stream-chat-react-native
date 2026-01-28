const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && value.constructor === Object;
};

/**
 * Resolves "$token" references in `dictionary` by performing a DFS.
 * deps first, then node - i.e. a topological evaluation.
 */
export const resolveTokensTopologically = <T extends Record<string, unknown>>(dictionary: T): T => {
  const resolvedMemo = new Map<string, unknown>();

  // Used purely for cycle detection (even though we do not expect
  // cycles we want to assert early to make sure we raise an alarm).
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

  /**
   * This is the topological sort part:
   * - DFS into dependencies first
   * - then memoize the current token
   */
  const dfs = (tokenKeyOrPath: string, originalRef: string): unknown => {
    const cacheKey = tokenKeyOrPath;

    if (resolvedMemo.has(cacheKey)) return resolvedMemo.get(cacheKey);

    if (visiting.has(cacheKey)) {
      throw new Error(`Cycle detected while topo-evaluating "${originalRef}" (at "${cacheKey}")`);
    }

    visiting.add(cacheKey);

    const raw = dictionary[tokenKeyOrPath];

    if (raw === undefined) {
      // is throwing maybe too strict here ?
      throw new Error(`Unresolved reference: "${originalRef}" (missing "${tokenKeyOrPath}")`);
    }

    // resolve dependencies inside `raw` BEFORE finalizing this token
    // so that we can throw if there's a cycle or the dep graph is not
    // connected)
    const fullyResolved = resolveValueDeep(raw);

    resolvedMemo.set(cacheKey, fullyResolved);
    visiting.delete(cacheKey);

    return fullyResolved;
  };

  return resolveValueDeep(dictionary) as T;
};
