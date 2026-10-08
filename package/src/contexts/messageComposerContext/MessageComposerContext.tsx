import React, { useContext, useEffect, useMemo, useState } from 'react';

import { LocalMessage, MessageComposer, MessageComposerState } from 'stream-chat';

import {
  MessageComposerAPIContextValue,
  MessageComposerAPIProvider,
} from './MessageComposerAPIContext';

import { ChannelProps } from '../../components';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useStateStore } from '../../hooks/useStateStore';
import { useChatContext } from '../chatContext/ChatContext';
import { ThreadContextValue } from '../threadContext/ThreadContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageComposerContextValue = {
  channel: ChannelProps['channel'];
  threadInstance: ThreadContextValue['threadInstance'];
  /**
   * The composer in use: the edit composer while a message is being edited, otherwise the thread's
   * or the channel's own.
   */
  messageComposer: MessageComposer;
  /**
   * The message being edited, if any.
   */
  editing?: LocalMessage;
};

export const MessageComposerContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageComposerContextValue,
);

type Props = React.PropsWithChildren<{
  value: Pick<MessageComposerContextValue, 'channel' | 'threadInstance'>;
}>;

const editedMessageSelector = (state: MessageComposerState) => ({
  editedMessage: state.editedMessage,
});

export const MessageComposerProvider = ({ children, value }: Props) => {
  const { client } = useChatContext();
  const { channel, threadInstance } = value;
  const [editComposer, setEditComposer] = useState<MessageComposer | undefined>(undefined);

  const messageComposer =
    editComposer ?? threadInstance?.messageComposer ?? channel.messageComposer;

  // Submitting or clearing the edit composer clears its edited message, which ends the edit.
  const { editedMessage } = useStateStore(editComposer?.state, editedMessageSelector) ?? {};
  useEffect(() => {
    if (editComposer && !editedMessage) {
      setEditComposer(undefined);
    }
  }, [editComposer, editedMessage]);

  useEffect(() => messageComposer.registerSubscriptions(), [messageComposer]);

  const setEditingState: MessageComposerAPIContextValue['setEditingState'] = useStableCallback(
    (message) => {
      if (!message) {
        setEditComposer(undefined);
        return;
      }
      const tag = MessageComposer.constructTag(message);
      const cachedComposer = client.messageComposerCache.get(tag);
      if (cachedComposer) {
        // Starts from the message itself, not from whatever an earlier, abandoned edit left behind.
        cachedComposer.initState({ composition: message });
        setEditComposer(cachedComposer);
        return;
      }
      const composer = new MessageComposer({
        client,
        composition: message,
        compositionContext: message,
      });
      // The cache also keeps the composer's channel in the client's channel store.
      client.messageComposerCache.add(tag, composer);
      setEditComposer(composer);
    },
  );

  const clearEditingState: MessageComposerAPIContextValue['clearEditingState'] = useStableCallback(
    () => setEditComposer(undefined),
  );

  const setQuotedMessage = useStableCallback((message: LocalMessage | null) =>
    messageComposer.setQuotedMessage(message),
  );

  const messageComposerContextValue = useMemo(
    () => ({ channel, editing: editedMessage ?? undefined, messageComposer, threadInstance }),
    [channel, editedMessage, messageComposer, threadInstance],
  );

  const messageComposerAPIContextValue = useMemo(
    () => ({ clearEditingState, setEditingState, setQuotedMessage }),
    [clearEditingState, setEditingState, setQuotedMessage],
  );

  return (
    <MessageComposerContext.Provider value={messageComposerContextValue}>
      <MessageComposerAPIProvider value={messageComposerAPIContextValue}>
        {children}
      </MessageComposerAPIProvider>
    </MessageComposerContext.Provider>
  );
};

export const useMessageComposerContext = () => {
  const contextValue = useContext(MessageComposerContext) as unknown as MessageComposerContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessageComposerContext hook was called outside of the MessageComposerContext provider.',
    );
  }

  return contextValue;
};
