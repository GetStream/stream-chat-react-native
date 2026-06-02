import type React from 'react';

import type { IconProps } from '../../icons';

export type ActionOptions = {
  onSuccess?: () => void;
  onFailure?: (error: unknown) => void;
};

export type ActionHandler = (options?: ActionOptions) => Promise<void>;

export type ActionItem<TId extends string = string> = {
  action: ActionHandler;
  Icon: React.ComponentType<IconProps>;
  id: TId;
  label: string;
  type: 'destructive' | 'standard';
};
