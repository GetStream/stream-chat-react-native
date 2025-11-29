import React, { type PropsWithChildren, useMemo, useState } from 'react';
import type { AbstractMediaPickerService } from '../services/media-picker-service/AbstractMediaPickerService';
import {
  createNewComposerStore,
  type MessageComposerState,
} from '../store/composer/store';
import { MediaPickerService } from '../services';
import type { StateStore } from '@stream-io/state-store';
import { useStableCallback } from '../internal/hooks/useStableCallback';
import type { AIMessageComposerProps } from '../message-composer';

export type MessageComposerContext = {
  state: StateStore<MessageComposerState>;
  setText: (text: string) => void | Promise<void>;
  sendMessage: () => void | Promise<void>;
  mediaPickerService?: AbstractMediaPickerService;
};

export type MessageComposerContextProps = PropsWithChildren<
  Pick<AIMessageComposerProps, 'onSendMessage'>
>;

export const MessageComposerContext = React.createContext<
  MessageComposerContext | undefined
>(undefined);

export const MessageComposerProvider = ({
  onSendMessage,
  children,
}: MessageComposerContextProps) => {
  const [mediaPickerService] = useState(() =>
    MediaPickerService ? new MediaPickerService() : undefined,
  );
  const [state] = useState(() => createNewComposerStore());

  const setText = useStableCallback((text: string) =>
    state.partialNext({ text }),
  );

  const clearState = useStableCallback(() => {
    setText('');
    mediaPickerService?.clearAssets();
  });

  const sendMessage = useStableCallback(async () => {
    const { text, custom } = state.getLatestValue();

    const data = {
      text,
      attachments: mediaPickerService?.state.getLatestValue().assets,
      custom,
    };

    clearState();

    await onSendMessage(data);
  });

  const contextValue = useMemo(
    () => ({ mediaPickerService, state, setText, sendMessage, clearState }),
    [state, mediaPickerService, setText, sendMessage, clearState],
  );

  return (
    <MessageComposerContext.Provider value={contextValue}>
      {children}
    </MessageComposerContext.Provider>
  );
};

export const useMessageComposerContext = () => {
  const value = React.useContext(MessageComposerContext);
  if (value === undefined) {
    throw new Error(
      'The useMessageComposerContext hook was called outside of the MessageComposerContext provider.',
    );
  }

  return value;
};
