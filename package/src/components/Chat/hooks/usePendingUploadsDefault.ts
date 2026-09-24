import { useEffect } from 'react';

import type { StreamChat } from 'stream-chat';

/**
 * Supplies the SDK's default for `messageComposer.attachments.pendingUploadsEnabled` — whether a
 * message can be sent while its attachments are still uploading — and nothing more.
 *
 * Offline support depends on the local message keeping its pending attachments, which is exactly
 * what this switch does, so enabling `enableOfflineSupport` turns it on. With offline support off
 * nothing is written and `stream-chat`'s own default (`false`) applies.
 *
 * Written only when the integrator has not registered a value. Set it on the client to take the
 * decision yourself — ideally before handing the client to `<Chat>`, so this never writes at all:
 *
 * ```ts
 * client.config.set({ messageComposer: { attachments: { pendingUploadsEnabled: false } } });
 * ```
 *
 * Once written, the value is never taken back: the hook cannot tell its own write from an
 * integrator's later write of the same value, so a later `enableOfflineSupport={false}` leaves
 * pending uploads on rather than risk overwriting a value the integrator chose.
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

    // Deliberately no teardown, for the same reason as the network reporter in `useIsOnline`: the
    // configuration lives as long as the client, which outlives `<Chat>`.
  }, [client, enableOfflineSupport]);
};
