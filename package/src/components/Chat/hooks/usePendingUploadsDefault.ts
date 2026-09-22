import { useEffect, useRef } from 'react';

import type { StreamChat } from 'stream-chat';

/**
 * Supplies the SDK's default for `messageComposer.attachments.pendingUploadsEnabled` — whether a
 * message can be sent while its attachments are still uploading — and nothing more.
 *
 * The default follows `enableOfflineSupport`: offline support depends on the local message keeping
 * its pending attachments, which is exactly what this switch does.
 *
 * Written only when the integrator has not registered a value. Set it on the client to take the
 * decision yourself — ideally before handing the client to `<Chat>`, so this never writes at all:
 *
 * ```ts
 * client.config.set({ messageComposer: { attachments: { pendingUploadsEnabled: false } } });
 * ```
 *
 * The value this hook wrote is remembered, so a later `enableOfflineSupport` change moves the
 * default along with it, while a value registered by anyone else is never overwritten.
 */
export const usePendingUploadsDefault = (client: StreamChat, enableOfflineSupport: boolean) => {
  const written = useRef<{ client: StreamChat; value: boolean } | null>(null);

  useEffect(() => {
    if (!client) {
      return;
    }

    const registered =
      client.config.getConfig('messageComposer')?.attachments?.pendingUploadsEnabled;
    const ownsRegisteredValue =
      written.current?.client === client && written.current.value === registered;

    if (registered !== undefined && !ownsRegisteredValue) {
      return;
    }

    client.config.setConfig('messageComposer', {
      attachments: { pendingUploadsEnabled: enableOfflineSupport },
    });
    written.current = { client, value: enableOfflineSupport };

    // Deliberately no teardown, for the same reason as the network reporter in `useIsOnline`: the
    // configuration lives as long as the client, which outlives `<Chat>`.
  }, [client, enableOfflineSupport]);
};
