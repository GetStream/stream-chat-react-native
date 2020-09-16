export const getDisplayName = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
) => Component.displayName || Component.name || 'Component';
