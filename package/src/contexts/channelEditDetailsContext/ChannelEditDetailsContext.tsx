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

export type ChannelEditDetailsContextValue = {
  store: EditChannelDetailsStore;
  /** Saves the edited name and/or image. Rejects with an `AggregateError` if any update fails. */
  submit: () => Promise<void>;
  /** Compression quality from 0 to 1 (1 is best) for the channel image picked while editing. */
  compressImageQuality?: number;
  /** Overrides the request that uploads the channel image. */
  doFileUploadRequest?: GlobalFileUploadRequest;
};

/** Props of the {@link ChannelEditDetailsProvider}. */
export type ChannelEditDetailsProviderProps = PropsWithChildren<{
  /** Compression quality from 0 to 1 (1 is best) for the channel image picked while editing. */
  compressImageQuality?: number;
  /** Overrides the request that uploads the channel image. */
  doFileUploadRequest?: GlobalFileUploadRequest;
}>;

export const ChannelEditDetailsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelEditDetailsContextValue,
);

/**
 * Builds the {@link ChannelEditDetailsContextValue}. Rendered inside the
 * {@link NotificationTargetProvider} so notifications from `submit` resolve to the edit details
 * host.
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
 * Provides an {@link EditChannelDetailsStore} snapshotted from the channel in the
 * {@link ChannelDetailsContext}. Mount it once per edit session: the store does not track later
 * `channel.updated` events, so they cannot overwrite in-progress edits.
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
