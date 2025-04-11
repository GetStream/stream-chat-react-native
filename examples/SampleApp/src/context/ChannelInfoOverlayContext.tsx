import React, { useContext, useState } from 'react';

import { ChannelState } from 'stream-chat';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ChannelContextValue } from 'stream-chat-react-native';

import type { StackNavigatorParamList } from '../types';

type ChannelListScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'ChannelListScreen'
>;

export type ChannelInfoOverlayData = Partial<
  Pick<ChannelContextValue, 'channel'>
> & {
  clientId?: string;
  membership?: ChannelState['membership'];
  navigation?: ChannelListScreenNavigationProp;
};

export type ChannelInfoOverlayContextValue = {
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<ChannelInfoOverlayData>>;
  data?: ChannelInfoOverlayData;
};

export const ChannelInfoOverlayContext = React.createContext({} as ChannelInfoOverlayContextValue);

type Props = React.PropsWithChildren<{
  value?: ChannelInfoOverlayContextValue;
}>;

export const ChannelInfoOverlayProvider = ({ children, value }: Props) => {
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
  useContext(ChannelInfoOverlayContext) as unknown as ChannelInfoOverlayContextValue;
