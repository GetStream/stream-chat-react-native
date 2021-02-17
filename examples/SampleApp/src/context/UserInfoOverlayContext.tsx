import React, { useContext, useState } from 'react';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { ChannelState } from 'stream-chat';
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

type GroupChannelDetailsScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'GroupChannelDetailsScreen'
>;

export type UserInfoOverlayData = Partial<
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
  member?: ChannelState<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >['members'][0];
  navigation?: GroupChannelDetailsScreenNavigationProp;
};

export type UserInfoOverlayContextValue = {
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<UserInfoOverlayData>>;
  data?: UserInfoOverlayData;
};

export const UserInfoOverlayContext = React.createContext(
  {} as UserInfoOverlayContextValue,
);

export const UserInfoOverlayProvider: React.FC<{
  value?: UserInfoOverlayContextValue;
}> = ({ children, value }) => {
  const [data, setData] = useState(value?.data);

  const reset = () => {
    setData(value?.data);
  };

  const userInfoOverlayContext = {
    data,
    reset,
    setData,
  };
  return (
    <UserInfoOverlayContext.Provider
      value={userInfoOverlayContext as UserInfoOverlayContextValue}
    >
      {children}
    </UserInfoOverlayContext.Provider>
  );
};

export const useUserInfoOverlayContext = () =>
  (useContext(
    UserInfoOverlayContext,
  ) as unknown) as UserInfoOverlayContextValue;
