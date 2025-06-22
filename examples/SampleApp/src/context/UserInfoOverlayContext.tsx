import React, { useContext, useState } from 'react';

import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList } from '../types';

type GroupChannelDetailsScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'GroupChannelDetailsScreen'
>;

export type UserInfoOverlayData = Partial<
  Pick<{ channel: string }, 'channel'>
> & {
  member?: unknown;
  navigation?: GroupChannelDetailsScreenNavigationProp;
};

export type UserInfoOverlayContextValue = {
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<UserInfoOverlayData>>;
  data?: UserInfoOverlayData;
};

export const UserInfoOverlayContext = React.createContext({} as UserInfoOverlayContextValue);

type Props = React.PropsWithChildren<{
  value?: UserInfoOverlayContextValue;
}>;

export const UserInfoOverlayProvider = ({ children, value }: Props) => {
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
    <UserInfoOverlayContext.Provider value={userInfoOverlayContext as UserInfoOverlayContextValue}>
      {children}
    </UserInfoOverlayContext.Provider>
  );
};

export const useUserInfoOverlayContext = () =>
  useContext(UserInfoOverlayContext) as unknown as UserInfoOverlayContextValue;
