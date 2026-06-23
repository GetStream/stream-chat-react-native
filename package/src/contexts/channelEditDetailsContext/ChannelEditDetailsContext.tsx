import React, { PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import { NotificationTargetProvider } from '../../components/Notifications/NotificationTargetContext';
import { useChannelActions } from '../../hooks/actions/useChannelActions';
import { useStableCallback } from '../../hooks/useStableCallback';
import {
  EditChannelDetailsStore,
  isImageDirty,
  isNameDirty,
} from '../../state-store/edit-channel-details-store';
import type { File, GlobalFileUploadRequest } from '../../types/types';
import { useChannelDetailsContext } from '../channelDetailsContext/channelDetailsContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelEditDetailsContextValue = {
  store: EditChannelDetailsStore;
  /**
   * Saves the dirty channel details (name and/or image). Resolves once every
   * update succeeds and rejects if any of them fail.
   */
  submit: () => Promise<void>;
  /**
   * Compress image with quality (from 0 to 1, where 1 is best quality) applied
   * to the channel image picked during editing.
   */
  compressImageQuality?: number;
  /** Override the upload request used to upload the channel image. */
  doFileUploadRequest?: GlobalFileUploadRequest;
  /** Set the {@link compressImageQuality} used by the edit flow. */
  setCompressImageQuality?: (value?: number) => void;
  /** Set the {@link doFileUploadRequest} used by the edit flow. */
  setDoFileUploadRequest?: (value?: GlobalFileUploadRequest) => void;
};

export const ChannelEditDetailsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelEditDetailsContextValue,
);

/**
 * Builds the {@link ChannelEditDetailsContextValue}. Rendered inside the
 * {@link NotificationTargetProvider} so that notifications emitted by `submit`
 * (via {@link useChannelActions}) resolve to the channel edit details host.
 */
const ChannelEditDetailsContextProviderInner = ({ children }: PropsWithChildren<unknown>) => {
  const { channel } = useChannelDetailsContext();
  const { updateImage, updateName } = useChannelActions(channel);
  const [store] = useState(() => new EditChannelDetailsStore(channel));
  const [compressImageQuality, setCompressImageQuality] = useState<number | undefined>(undefined);
  const [doFileUploadRequest, _setDoFileUploadRequest] = useState<
    GlobalFileUploadRequest | undefined
  >(undefined);

  // Wrap the function setter so callers can pass the upload function directly
  // without React interpreting it as a state updater.
  const setDoFileUploadRequest = useCallback(
    (value?: GlobalFileUploadRequest) => _setDoFileUploadRequest(() => value),
    [],
  );

  const submit = useStableCallback(async () => {
    const state = store.state.getLatestValue();
    const { currentName, updatedImage } = state;
    const errors: unknown[] = [];
    const onFailure = (error: unknown) => errors.push(error);
    const tasks: Promise<void>[] = [];
    if (isNameDirty(state)) {
      tasks.push(updateName(currentName, { onFailure }));
    }
    if (isImageDirty(state)) {
      tasks.push(updateImage(updatedImage as File | null, { onFailure }, doFileUploadRequest));
    }
    await Promise.all(tasks);
    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to update channel details');
    }
  });

  const value = useMemo(
    () => ({
      compressImageQuality,
      doFileUploadRequest,
      setCompressImageQuality,
      setDoFileUploadRequest,
      store,
      submit,
    }),
    [compressImageQuality, doFileUploadRequest, setDoFileUploadRequest, store, submit],
  );

  return (
    <ChannelEditDetailsContext.Provider value={value}>
      {children}
    </ChannelEditDetailsContext.Provider>
  );
};

/**
 * Creates and provides an {@link EditChannelDetailsStore} snapshotted from the
 * channel in the {@link ChannelDetailsContext}. Mount this once per edit session — the store captures the
 * channel's name/image at construction and does not track later WebSocket
 * updates, so an inbound `channel.updated` does not clobber in-progress edits.
 *
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelEditDetailsProvider = ({ children }: PropsWithChildren<unknown>) => {
  const { channel } = useChannelDetailsContext();

  return (
    <NotificationTargetProvider
      hostId={`channel-edit-details:${channel.cid}`}
      panel='channel-details'
    >
      <ChannelEditDetailsContextProviderInner>{children}</ChannelEditDetailsContextProviderInner>
    </NotificationTargetProvider>
  );
};

/**
 * @experimental This API is experimental and is subject to change.
 */
export const useChannelEditDetailsContext = () => {
  const contextValue = useContext(
    ChannelEditDetailsContext,
  ) as unknown as ChannelEditDetailsContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelEditDetailsContext hook was called outside of the ChannelEditDetailsContext provider. Render the channel edit UI inside a ChannelEditDetailsProvider.',
    );
  }

  return contextValue;
};
