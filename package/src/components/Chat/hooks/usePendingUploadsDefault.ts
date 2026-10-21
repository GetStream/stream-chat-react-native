import { useEffect } from 'react';

import type { StreamChat } from 'stream-chat';

/**
 * Turns on `messageComposer.attachments.pendingUploadsEnabled` (sending while attachments are still
 * uploading) when offline support is enabled, since offline support needs the local message to keep
 * its pending attachments. Without offline support nothing is written and the `stream-chat`
 * default (`false`) applies.
 *
 * Nothing is written when a value is already registered. Set it on the client, ideally before
 * handing the client to `<Chat>`, to choose yourself:
 *
 * ```ts
 * client.config.set({ messageComposer: { attachments: { pendingUploadsEnabled: false } } });
 * ```
 *
 * The value is never reverted: the hook cannot tell its own write from an integrator's later write
 * of the same value, so a later `enableOfflineSupport={false}` leaves pending uploads on.
 *
 * @param client The client whose message composer configuration is written.
 * @param enableOfflineSupport Whether offline support is enabled.
 */
export const usePendingUploadsDefault = (client: StreamChat, enableOfflineSupport: boolean) => {
  useEffect(() => {
    if (!client || !enableOfflineSupport) {
      return;
    }

    const registered =
      client.config.getConfig('messageComposer')?.attachments?.pendingUploadsEnabled;
    if (registered !== undefined) {
      return;
    }

    client.config.setConfig('messageComposer', {
      attachments: { pendingUploadsEnabled: true },
    });

    // No teardown: the configuration lives as long as the client, which outlives `<Chat>`.
  }, [client, enableOfflineSupport]);
};
