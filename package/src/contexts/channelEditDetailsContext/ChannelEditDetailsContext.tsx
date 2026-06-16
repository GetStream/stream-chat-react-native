import React, { PropsWithChildren, useContext, useState } from 'react';

import { Channel } from 'stream-chat';

import { EditChannelDetailsStore } from '../../state-store/edit-channel-details-store';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelEditDetailsContextValue = {
  store: EditChannelDetailsStore;
};

export const ChannelEditDetailsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelEditDetailsContextValue,
);

/**
 * Creates and provides an {@link EditChannelDetailsStore} snapshotted from the
 * given channel. Mount this once per edit session — the store captures the
 * channel's name/image at construction and does not track later WebSocket
 * updates, so an inbound `channel.updated` does not clobber in-progress edits.
 *
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelEditDetailsProvider = ({
  channel,
  children,
}: PropsWithChildren<{ channel: Channel }>) => {
  const [store] = useState(() => new EditChannelDetailsStore(channel));

  return (
    <ChannelEditDetailsContext.Provider value={{ store }}>
      {children}
    </ChannelEditDetailsContext.Provider>
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
