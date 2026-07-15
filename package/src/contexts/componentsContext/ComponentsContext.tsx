import React, { PropsWithChildren, useContext, useMemo } from 'react';

/**
 * All overridable UI components in the SDK.
 * Derived from the DEFAULT_COMPONENTS map in defaultComponents.ts.
 * Adding a new default automatically makes it available as an override.
 *
 * Every key is optional — only specify the components you want to override.
 *
 * The `icons` slot is a nested map: it is typed as a *partial* icon map so
 * integrators can override individual icons without having to supply them all.
 * Sibling defaults are preserved via a deep merge (see below).
 */
export type ComponentOverrides = Omit<
  Partial<(typeof import('./defaultComponents'))['DEFAULT_COMPONENTS']>,
  'icons'
> &
  import('./defaultComponents').OptionalComponentOverrides & {
    icons?: Partial<import('./defaultComponents').IconsMap>;
  };

/**
 * Resolved component overrides with defaults filled in. Unlike
 * `ComponentOverrides`, the `icons` map is guaranteed fully populated (defaults
 * back every key), so consumers can read `icons.Mute` without a null check.
 */
export type ResolvedComponents = Required<Omit<ComponentOverrides, 'icons'>> & {
  icons: import('./defaultComponents').IconsMap;
};

const ComponentsContext = React.createContext<ComponentOverrides>({});

/**
 * Provider to override UI components at any level of the tree.
 * Supports nesting — inner overrides merge over outer ones (closest wins).
 *
 * @example
 * ```tsx
 * <WithComponents overrides={{ Message: MyCustomMessage, SendButton: MyCustomSendButton }}>
 *   <Channel channel={channel}>
 *     <MessageList />
 *     <MessageInput />
 *   </Channel>
 * </WithComponents>
 * ```
 */
export const WithComponents = ({
  children,
  overrides,
}: PropsWithChildren<{ overrides: ComponentOverrides }>) => {
  const parent = useContext(ComponentsContext);
  const merged = useMemo(
    () => ({
      ...parent,
      ...overrides,
      // Deep-merge the nested `icons` map so overriding one icon keeps the
      // rest (a shallow spread would replace the whole map).
      icons: { ...parent.icons, ...overrides.icons },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally stable: overrides are set once at mount
    [],
  );
  return <ComponentsContext.Provider value={merged}>{children}</ComponentsContext.Provider>;
};

// Lazy-loaded to break circular dependency:
// defaultComponents.ts → imports components → components import useComponentsContext from this file
let cachedDefaults: ComponentOverrides | undefined;
const getDefaults = (): ComponentOverrides => {
  if (!cachedDefaults) {
    cachedDefaults = (require('./defaultComponents') as { DEFAULT_COMPONENTS: ComponentOverrides })
      .DEFAULT_COMPONENTS;
  }
  return cachedDefaults;
};

/**
 * Hook to access resolved component overrides.
 * Returns all components with defaults filled in — user overrides merged over defaults.
 */
export const useComponentsContext = () => {
  const overrides = useContext(ComponentsContext);
  return useMemo(() => {
    const defaults = getDefaults();
    return {
      ...defaults,
      ...overrides,
      // Deep-merge icons so user overrides layer over the full default map.
      icons: { ...defaults.icons, ...overrides.icons },
    } as ResolvedComponents;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally stable: overrides are set once at mount
  }, []);
};
