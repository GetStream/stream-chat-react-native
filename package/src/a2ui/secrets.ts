import type { ComponentApi, SurfaceModel } from '@a2ui/web_core';

import { isRecord } from '../ai-components/generative-ui/AIUIHelpers';

/**
 * `value` without the person's secrets, such as a password they typed into an obscured TextField:
 * each string that holds one has it cut out, wherever it is, so none reaches the agent.
 */
export const withoutSecrets = <T>(value: T, secrets: readonly string[]): T => {
  const known = secrets.filter((secret) => secret !== '');
  if (known.length === 0) return value;
  const clean = (item: unknown): unknown => {
    if (typeof item === 'string') {
      return known.reduce((text, secret) => text.split(secret).join(''), item);
    }
    if (Array.isArray(item)) return item.map(clean);
    if (isRecord(item)) {
      return Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, clean(entry)]));
    }
    return item;
  };
  return clean(value) as T;
};

const absolute = (path: string) => (path.startsWith('/') ? path : `/${path}`);

// The paths each surface's obscured fields write, as they resolved when they showed: inside a
// list, or with a variant bound to the data model, the components alone don't tell.
const shownSecretPaths = new WeakMap<object, Set<string>>();

/** Keeps what is written at `path` of `surface`'s data model from the agent, such as a password. */
export const keepSecretPath = (surface: SurfaceModel<ComponentApi>, path: string) => {
  let paths = shownSecretPaths.get(surface);
  if (!paths) {
    paths = new Set();
    shownSecretPaths.set(surface, paths);
  }
  paths.add(path);
};

/**
 * The data model paths a surface's obscured TextFields write, such as a password's: those its
 * components name, whether or not they show, and those of the ones that showed.
 */
export const secretPathsOf = (surface: SurfaceModel<ComponentApi> | undefined) => {
  const paths: string[] = [...((surface && shownSecretPaths.get(surface)) ?? [])];
  for (const component of surface?.componentsModel.values ?? []) {
    const { value, variant } = component.properties as Record<string, unknown>;
    if (component.type !== 'TextField' || variant !== 'obscured' || !isRecord(value)) continue;
    const path = value['@path'];
    if (typeof path === 'string' && !paths.includes(absolute(path))) paths.push(absolute(path));
  }
  return paths;
};

/** What the person typed into a surface's obscured TextFields. */
export const secretValuesOf = (surface: SurfaceModel<ComponentApi> | undefined): string[] =>
  secretPathsOf(surface).flatMap((path) => {
    const value: unknown = surface?.dataModel.get(path);
    return typeof value === 'string' && value !== '' ? [value] : [];
  });

/** The keys of an action's context the agent bound to one of the surface's obscured fields. */
export const secretContextKeysOf = (
  surface: SurfaceModel<ComponentApi> | undefined,
  sourceComponentId: string,
) => {
  const secretPaths = secretPathsOf(surface);
  const action: unknown = surface?.componentsModel.get(sourceComponentId)?.properties.action;
  const context = isRecord(action) && isRecord(action.event) ? action.event.context : undefined;
  if (!isRecord(context)) return [];
  return Object.entries(context).flatMap(([key, value]) => {
    const path = isRecord(value) ? value['@path'] : undefined;
    if (typeof path !== 'string') return [];
    const bound = absolute(path);
    return secretPaths.some((secret) => bound === secret || bound.startsWith(`${secret}/`))
      ? [key]
      : [];
  });
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
