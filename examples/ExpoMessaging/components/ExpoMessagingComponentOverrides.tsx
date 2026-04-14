import { useMemo } from 'react';
import type { ComponentOverrides } from 'stream-chat-expo';

import InputButtons from './InputButtons';
import { MessageLocation } from './LocationSharing/MessageLocation';

export const useExpoMessagingComponentOverrides = () => {
  return useMemo<ComponentOverrides>(
    () => ({ InputButtons, MessageLocation }),
    [],
  );
};
