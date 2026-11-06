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
 * The channel's message composer content as a draft message.
 *
 * @param params.channel The channel being previewed.
 * @returns The draft, or `undefined` when the composer is empty or has no text and no attachments.
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

  const draftMessage = useMemo<DraftMessage | undefined>(() => {
    if (channel.messageComposer.compositionIsEmpty) {
      return undefined;
    }

    if (!draftText && !attachments?.length) {
      return undefined;
    }

    return {
      attachments,
      custom: {},
      id: channel.messageComposer.id,
      text: draftText ?? '',
    };
  }, [channel.messageComposer, attachments, draftText]);

  return draftMessage;
};
