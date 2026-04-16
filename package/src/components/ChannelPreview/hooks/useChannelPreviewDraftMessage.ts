import { useMemo } from 'react';

import { AttachmentManagerState, Channel, DraftMessage, TextComposerState } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

const textComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

export type UseChannelPreviewDraftMessageProps = {
  channel: Channel;
};

/**
 * Hook to get the draft message for a channel preview.
 * @param {UseChannelPreviewDraftMessageProps} param0
 * @returns {DraftMessage | undefined}
 */
export const useChannelPreviewDraftMessage = ({ channel }: UseChannelPreviewDraftMessageProps) => {
  const { text: draftText } = useStateStore(
    channel.messageComposer.textComposer.state,
    textComposerStateSelector,
  );

  const { attachments } = useStateStore(
    channel.messageComposer.attachmentManager.state,
    stateSelector,
  );

  const draftMessage: DraftMessage | undefined = useMemo(
    () =>
      !channel.messageComposer.compositionIsEmpty
        ? attachments && draftText
          ? {
              attachments,
              id: channel.messageComposer.id,
              text: draftText,
            }
          : undefined
        : undefined,
    [channel.messageComposer, attachments, draftText],
  );

  return draftMessage;
};
