import React, { PropsWithChildren, useContext, useMemo } from 'react';

/**
 * All overridable UI components in the SDK.
 * Derived from the DEFAULT_COMPONENTS map in defaultComponents.ts.
 * Adding a new default automatically makes it available as an override.
 *
 * Every key is optional — only specify the components you want to override.
 */
export type ComponentOverrides = Partial<
  (typeof import('./defaultComponents'))['DEFAULT_COMPONENTS']
> &
  import('./defaultComponents').OptionalComponentOverrides;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally stable: overrides are set once at mount
  const merged = useMemo(() => ({ ...parent, ...overrides }), []);
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
  return useMemo(
    () => ({ ...getDefaults(), ...overrides }) as Required<ComponentOverrides>,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally stable: overrides are set once at mount
    [],
  );
};
