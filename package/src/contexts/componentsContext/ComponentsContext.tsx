import React, { PropsWithChildren, useContext, useMemo } from 'react';

/**
 * The overridable UI components, derived from `DEFAULT_COMPONENTS` in `defaultComponents.ts`, so a
 * new default is overridable automatically. Every key is optional.
 *
 * `icons` is a partial map: overriding one icon keeps the other defaults.
 */
export type ComponentOverrides = Omit<
  Partial<(typeof import('./defaultComponents'))['DEFAULT_COMPONENTS']>,
  'icons'
> &
  import('./defaultComponents').OptionalComponentOverrides & {
    icons?: Partial<import('./defaultComponents').IconsMap>;
  };

/**
 * The component overrides merged over the defaults. Unlike `ComponentOverrides`, every key is
 * defined, including each entry of `icons`.
 */
export type ResolvedComponents = Required<Omit<ComponentOverrides, 'icons'>> & {
  icons: import('./defaultComponents').IconsMap;
};

const ComponentsContext = React.createContext<ComponentOverrides>({});

/**
 * Overrides UI components for the tree below it. Nested providers merge, and the closest wins.
 *
 * `overrides` is read once at mount and must be stable.
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
      // `icons` is merged one level deeper so overriding one icon keeps the rest.
      icons: { ...parent.icons, ...overrides.icons },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally stable: overrides are set once at mount
    [],
  );
  return <ComponentsContext.Provider value={merged}>{children}</ComponentsContext.Provider>;
};

// Required lazily to break a circular import: `defaultComponents` imports components, which import
// `useComponentsContext` from this file.
let cachedDefaults: ComponentOverrides | undefined;
const getDefaults = (): ComponentOverrides => {
  if (!cachedDefaults) {
    cachedDefaults = (require('./defaultComponents') as { DEFAULT_COMPONENTS: ComponentOverrides })
      .DEFAULT_COMPONENTS;
  }
  return cachedDefaults;
};

/**
 * Returns every overridable component, with the user's overrides merged over the defaults.
 */
export const useComponentsContext = () => {
  const overrides = useContext(ComponentsContext);
  return useMemo(() => {
    const defaults = getDefaults();
    return {
      ...defaults,
      ...overrides,
      // `icons` is merged one level deeper so overriding one icon keeps the rest.
      icons: { ...defaults.icons, ...overrides.icons },
    } as ResolvedComponents;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally stable: overrides are set once at mount
  }, []);
};
