import { useMessageComposer, useMessageInputContext, useStableCallback } from 'stream-chat-expo';

import type { ComposerViewProps } from 'stream-chat-expo/ai-components';

export type AIMessage = Parameters<ComposerViewProps['onSendMessage']>[0];

/**
 * Sends a message to the AI channel through the channel's composer, with its attachments. Shared
 * by the composer and voice mode, so both go through the client's `sendMessageRequest` handler
 * (which starts the agent on the first message).
 */
export const useSendAIMessage = () => {
  const messageComposer = useMessageComposer();
  const { sendMessage } = useMessageInputContext();

  return useStableCallback(async ({ text, attachments }: AIMessage) => {
    messageComposer.textComposer.setText(text);
    if (attachments && attachments.length > 0) {
      const localAttachments = await Promise.all(
        attachments.map((asset) =>
          messageComposer.attachmentManager.fileToLocalUploadAttachment({
            ...asset,
            // The picker can leave these out (e.g. some iOS photos have no file name).
            name: asset.name ?? asset.uri.split('/').pop() ?? 'image',
            size: asset.size ?? 0,
            type: asset.type ?? 'image/jpeg',
          }),
        ),
      );
      messageComposer.attachmentManager.upsertAttachments(localAttachments);
    }

    await sendMessage();
  });
};
