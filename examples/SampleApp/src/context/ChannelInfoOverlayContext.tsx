import React, { useContext, useState } from 'react';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { ChannelContextValue } from 'stream-chat-react-native';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';

type ChannelListScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'ChannelListScreen'
>;

export type ChannelInfoOverlayData = Partial<
  Pick<
    ChannelContextValue<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >,
    'channel'
  >
> & {
  clientId?: string;
  navigation?: ChannelListScreenNavigationProp;
};

export type ChannelInfoOverlayContextValue = {
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<ChannelInfoOverlayData>>;
  data?: ChannelInfoOverlayData;
};

export const ChannelInfoOverlayContext = React.createContext(
  {} as ChannelInfoOverlayContextValue,
);

export const ChannelInfoOverlayProvider: React.FC<{
  value?: ChannelInfoOverlayContextValue;
}> = ({ children, value }) => {
  const [data, setData] = useState(value?.data);

  const reset = () => {
    setData(value?.data);
  };

  const channelInfoOverlayContext = {
    data,
    reset,
    setData,
  };
  return (
    <ChannelInfoOverlayContext.Provider
      value={channelInfoOverlayContext as ChannelInfoOverlayContextValue}
    >
      {children}
    </ChannelInfoOverlayContext.Provider>
  );
};

export const useChannelInfoOverlayContext = () =>
  (useContext(
    ChannelInfoOverlayContext,
  ) as unknown) as ChannelInfoOverlayContextValue;
