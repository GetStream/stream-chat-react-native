import React, { useContext, useState } from 'react';


export type ChannelInfoOverlayData = Partial<
  Pick<{ channel: string }, 'channel'>
> & {
  clientId?: string;
  membership?: unknown;
  navigation?: unknown;
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
