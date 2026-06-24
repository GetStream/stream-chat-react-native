import React, { PropsWithChildren, useContext, useMemo, useState } from 'react';

import { NotificationTargetProvider } from '../../components/Notifications/NotificationTargetContext';
import { useChannelActions } from '../../hooks/actions/useChannelActions';
import { useStableCallback } from '../../hooks/useStableCallback';
import {
  EditChannelDetailsStore,
  isImageEdited,
  isNameEdited,
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
   * Saves the edited channel details (name and/or image). Resolves once every
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
};

/**
 * Props for the {@link ChannelEditDetailsProvider} that seed the edit flow
 * configuration into the context.
 */
export type ChannelEditDetailsProviderProps = PropsWithChildren<{
  /**
   * Compress image with quality (from 0 to 1, where 1 is best quality) applied
   * to the channel image picked during editing.
   */
  compressImageQuality?: number;
  /** Override the upload request used to upload the channel image. */
  doFileUploadRequest?: GlobalFileUploadRequest;
}>;

export const ChannelEditDetailsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelEditDetailsContextValue,
);

/**
 * Builds the {@link ChannelEditDetailsContextValue}. Rendered inside the
 * {@link NotificationTargetProvider} so that notifications emitted by `submit`
 * (via {@link useChannelActions}) resolve to the channel edit details host.
 */
const ChannelEditDetailsContextProviderInner = ({
  children,
  compressImageQuality,
  doFileUploadRequest,
}: ChannelEditDetailsProviderProps) => {
  const { channel } = useChannelDetailsContext();
  const { updateImage, updateName } = useChannelActions(channel);
  const [store] = useState(() => new EditChannelDetailsStore(channel));

  const submit = useStableCallback(async () => {
    const state = store.state.getLatestValue();
    const { currentName, updatedImage } = state;
    const errors: unknown[] = [];
    const onFailure = (error: unknown) => errors.push(error);
    const tasks: Promise<void>[] = [];
    if (isNameEdited(state)) {
      tasks.push(updateName(currentName, { onFailure }));
    }
    if (isImageEdited(state)) {
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
      store,
      submit,
    }),
    [compressImageQuality, doFileUploadRequest, store, submit],
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
export const ChannelEditDetailsProvider = ({
  children,
  compressImageQuality,
  doFileUploadRequest,
}: ChannelEditDetailsProviderProps) => {
  const { channel } = useChannelDetailsContext();

  return (
    <NotificationTargetProvider
      hostId={`channel-edit-details:${channel.cid}`}
      panel='channel-details'
    >
      <ChannelEditDetailsContextProviderInner
        compressImageQuality={compressImageQuality}
        doFileUploadRequest={doFileUploadRequest}
      >
        {children}
      </ChannelEditDetailsContextProviderInner>
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
