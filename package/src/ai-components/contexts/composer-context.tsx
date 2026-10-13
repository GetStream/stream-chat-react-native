import React, { type PropsWithChildren, useMemo, useState } from 'react';
import type { AbstractMediaPickerService } from '../services/media-picker-service/AbstractMediaPickerService';
import { type ComposerState, createNewComposerStore } from '../store';
import { MediaPickerService } from '../services';
import type { StateStore } from '@stream-io/state-store';
import { useStableCallback } from '../internal/hooks/useStableCallback';
import type { ComposerViewProps } from '../message-composer';

export type ComposerContext = {
  state: StateStore<ComposerState>;
  setText: (text: string) => void | Promise<void>;
  sendMessage: () => void | Promise<void>;
  mediaPickerService?: AbstractMediaPickerService;
};

export type ComposerContextProps = PropsWithChildren<
  Pick<ComposerViewProps, 'onSendMessage' | 'mediaPickerService' | 'state'>
>;

export const ComposerContext = React.createContext<ComposerContext | undefined>(
  undefined,
);

export const ComposerProvider = ({
  onSendMessage,
  mediaPickerService: mediaPickerServiceOverride,
  state: stateOverride,
  children,
}: ComposerContextProps) => {
  const [mediaPickerService] = useState(
    () =>
      mediaPickerServiceOverride ??
      (MediaPickerService ? new MediaPickerService() : undefined),
  );
  const [state] = useState(() => stateOverride ?? createNewComposerStore());

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
    <ComposerContext.Provider value={contextValue}>
      {children}
    </ComposerContext.Provider>
  );
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
