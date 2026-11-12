import React, { type PropsWithChildren, useMemo, useState } from 'react';

import type { StateStore } from '@stream-io/state-store';

import { useStableCallback } from '../internal/hooks/useStableCallback';
import type { ComposerViewProps } from '../message-composer';
import type { AIChatOption } from '../message-composer/ChatOptions';
import { MediaPickerService } from '../services';
import type { AbstractMediaPickerService } from '../services/media-picker-service/AbstractMediaPickerService';
import { type ComposerState, createNewComposerStore } from '../store';

export type ComposerContext = {
  state: StateStore<ComposerState>;
  setText: (text: string) => void | Promise<void>;
  /** Picks the chat option for the next message, or removes it with `null`. */
  setChatOption: (option: AIChatOption | null) => void;
  sendMessage: () => void | Promise<void>;
  mediaPickerService?: AbstractMediaPickerService;
};

export type ComposerContextProps = PropsWithChildren<
  Pick<ComposerViewProps, 'onSendMessage' | 'mediaPickerService' | 'state'>
>;

export const ComposerContext = React.createContext<ComposerContext | undefined>(undefined);

export const ComposerProvider = ({
  onSendMessage,
  mediaPickerService: mediaPickerServiceOverride,
  state: stateOverride,
  children,
}: ComposerContextProps) => {
  const [mediaPickerService] = useState(
    () => mediaPickerServiceOverride ?? (MediaPickerService ? new MediaPickerService() : undefined),
  );
  const [ownState] = useState(createNewComposerStore);
  const state = stateOverride ?? ownState;

  const setText = useStableCallback((text: string) => state.partialNext({ text }));
  const setChatOption = useStableCallback((chatOption: AIChatOption | null) =>
    state.partialNext({ chatOption }),
  );

  const clearState = useStableCallback(() => {
    setText('');
    mediaPickerService?.clearAssets();
  });

  const sendMessage = useStableCallback(async () => {
    const { chatOption, custom, text } = state.getLatestValue();

    const data = {
      text,
      attachments: mediaPickerService?.state.getLatestValue().assets,
      chatOption: chatOption ?? undefined,
      custom,
    };

    clearState();

    await onSendMessage?.(data);
  });

  const contextValue = useMemo(
    () => ({ mediaPickerService, state, setChatOption, setText, sendMessage, clearState }),
    [state, mediaPickerService, setChatOption, setText, sendMessage, clearState],
  );

  return <ComposerContext.Provider value={contextValue}>{children}</ComposerContext.Provider>;
};

export const useMessageComposerContext = () => {
  const value = React.useContext(ComposerContext);
  if (value === undefined) {
    throw new Error(
      'The useMessageComposerContext hook was called outside of the ComposerContext provider.',
    );
  }

  return value;
};
