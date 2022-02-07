import type { ComponentType } from 'react';

import type { ExtendableGenerics } from 'stream-chat';

export const getDisplayName = <StreamChatClient extends ExtendableGenerics>(
  Component: ComponentType<StreamChatClient>,
) => Component.displayName || Component.name || 'Component';
