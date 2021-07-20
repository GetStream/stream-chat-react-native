import type { UnknownType } from '../../types/types';

export const getDisplayName = <P extends UnknownType>(Component: React.ComponentType<P>) =>
  Component.displayName || Component.name || 'Component';
