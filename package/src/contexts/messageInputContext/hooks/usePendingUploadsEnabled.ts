import type { MessageComposerConfig } from 'stream-chat';

import { useMessageComposer } from './useMessageComposer';

import { useStateStore } from '../../../hooks/useStateStore';

export const pendingUploadsEnabledSelector = (config: MessageComposerConfig) => ({
  pendingUploadsEnabled: config.attachments.pendingUploadsEnabled,
});

/**
 * Whether the current composer lets a message be sent while its attachments are still uploading —
 * `messageComposer.attachments.pendingUploadsEnabled`, resolved per composer, so a thread composer
 * answers for itself.
 */
export const usePendingUploadsEnabled = () => {
  const messageComposer = useMessageComposer();
  return useStateStore(messageComposer.configState, pendingUploadsEnabledSelector)
    .pendingUploadsEnabled;
};
