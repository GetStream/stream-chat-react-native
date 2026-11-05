import { useMemo } from 'react';

import type { ComponentOverrides } from 'stream-chat-expo';
import { ExpoAttachmentPicker } from 'stream-chat-expo/attachment-picker';

import { useExpoAttachmentPicker } from './attachmentPicker';
import InputButtons from './InputButtons';
import { MessageLocation } from './LocationSharing/MessageLocation';

export const useExpoMessagingComponentOverrides = () => {
  return useMemo<ComponentOverrides>(
    () => ({
      InputButtons,
      MessageLocation,
      ...(useExpoAttachmentPicker ? { AttachmentPicker: ExpoAttachmentPicker } : {}),
    }),
    [],
  );
};
