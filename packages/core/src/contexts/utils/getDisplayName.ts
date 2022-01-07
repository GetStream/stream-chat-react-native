import type { ComponentType } from 'react';

import type { UnknownType } from '../../types/types';

export const getDisplayName = <P extends UnknownType>(Component: ComponentType<P>) =>
  Component.displayName || Component.name || 'Component';
