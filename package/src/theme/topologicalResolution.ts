type ResolveOptions = {
  strict?: boolean;
  allowDotPath?: boolean;

  /**
   * If true, we collect a "dependency-first" evaluation order (a topo order).
   * Useful for debugging / precomputing.
   */
  collectTopoOrder?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && (value as any).constructor === Object;
}

function getByPath(root: any, path: string): unknown {
  const parts = path.split('.').filter(Boolean);
  let cur: any = root;
  for (const p of parts) {
    if (cur == null || (typeof cur !== 'object' && typeof cur !== 'function')) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Resolves "$token" references in `dictionary` by performing a DFS:
 * deps first, then node — i.e. a topological evaluation.
 *
 * If collectTopoOrder is enabled, returns the explicit topo evaluation order
 * (each token appears after its dependencies).
 */
export function resolveTokenRefsWithTopoEvaluation<T extends Record<string, any>>(
  dictionary: T,
  options: ResolveOptions = {},
): { resolved: T; topoOrder?: string[] } {
  const { strict = true, allowDotPath = false, collectTopoOrder = false } = options;

  const resolvedMemo = new Map<string, unknown>();

  // "active DFS stack" for cycle detection
  const visiting = new Set<string>();

  // Optional: explicit "topological evaluation" order
  const topoOrder: string[] | undefined = collectTopoOrder ? [] : undefined;
  const topoPushed = new Set<string>(); // avoid duplicates in topoOrder

  const resolveValueDeep = (value: unknown): unknown => {
    if (typeof value === 'string' && value.startsWith('$')) {
      return evaluateTokenByTopoDFS(value.slice(1), value);
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
   * This is the "toposort" part:
   * - DFS into dependencies first
   * - then memoize the current token
   * - optionally push token into topoOrder AFTER its deps are resolved
   */
  const evaluateTokenByTopoDFS = (tokenKeyOrPath: string, originalRef: string): unknown => {
    const cacheKey = tokenKeyOrPath;

    if (resolvedMemo.has(cacheKey)) return resolvedMemo.get(cacheKey);

    if (visiting.has(cacheKey)) {
      throw new Error(`Cycle detected while topo-evaluating "${originalRef}" (at "${cacheKey}")`);
    }

    visiting.add(cacheKey);

    const raw = allowDotPath
      ? getByPath(dictionary, tokenKeyOrPath)
      : (dictionary as any)[tokenKeyOrPath];

    if (raw === undefined) {
      visiting.delete(cacheKey);
      if (strict) {
        throw new Error(`Unresolved reference: "${originalRef}" (missing "${tokenKeyOrPath}")`);
      }
      return originalRef;
    }

    // DFS: resolve dependencies inside `raw` BEFORE finalizing this token.
    const fullyResolved = resolveValueDeep(raw);

    resolvedMemo.set(cacheKey, fullyResolved);
    visiting.delete(cacheKey);

    if (topoOrder && !topoPushed.has(cacheKey)) {
      topoOrder.push(cacheKey); // deps-first ⇒ topo order
      topoPushed.add(cacheKey);
    }

    return fullyResolved;
  };

  const resolved = resolveValueDeep(dictionary) as T;

  return { resolved, topoOrder };
}
