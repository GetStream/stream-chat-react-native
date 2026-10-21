import type { MessageComposerConfig } from 'stream-chat';

import { useMessageComposer } from './useMessageComposer';

import { useStateStore } from '../../../hooks/useStateStore';

export const pendingUploadsEnabledSelector = (config: MessageComposerConfig) => ({
  pendingUploadsEnabled: config.attachments.pendingUploadsEnabled,
});

/**
 * Whether the current composer lets a message be sent while its attachments are still uploading.
 * Read from the composer's `attachments.pendingUploadsEnabled` config, so a thread composer answers
 * for itself.
 *
 * @returns The composer's `attachments.pendingUploadsEnabled` setting.
 */
export const usePendingUploadsEnabled = () => {
  const messageComposer = useMessageComposer();
  return useStateStore(messageComposer.configState, pendingUploadsEnabledSelector)
    .pendingUploadsEnabled;
};
