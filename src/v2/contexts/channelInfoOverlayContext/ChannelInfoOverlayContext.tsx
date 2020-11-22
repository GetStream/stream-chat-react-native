import React, { PropsWithChildren, useContext, useState } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { ChannelContextValue } from '../channelContext/ChannelContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type ChannelInfoOverlayData<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'channel'>
> & {
  clientId?: string;
};

export type ChannelInfoOverlayContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  reset: () => void;
  setData: React.Dispatch<
    React.SetStateAction<ChannelInfoOverlayData<At, Ch, Co, Ev, Me, Re, Us>>
  >;
  data?: ChannelInfoOverlayData<At, Ch, Co, Ev, Me, Re, Us>;
};

export const ChannelInfoOverlayContext = React.createContext(
  {} as ChannelInfoOverlayContextValue,
);

export const ChannelInfoOverlayProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value?: ChannelInfoOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => {
  const [data, setData] = useState(value?.data);

  const reset = () => {
    setData(value?.data);
  };

  const messageOverlayContext = {
    data,
    reset,
    setData,
  };
  return (
    <ChannelInfoOverlayContext.Provider
      value={messageOverlayContext as ChannelInfoOverlayContextValue}
    >
      {children}
    </ChannelInfoOverlayContext.Provider>
  );
};

export const useChannelInfoOverlayContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(
    ChannelInfoOverlayContext,
  ) as unknown) as ChannelInfoOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>;

/**
 * Typescript currently does not support partial inference so if ChannelInfoOverlayContext
 * typing is desired while using the HOC withChannelInfoOverlayContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelInfoOverlayContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<
  Omit<P, keyof ChannelInfoOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>>
> => {
  const WithChannelInfoOverlayContextComponent = (
    props: Omit<
      P,
      keyof ChannelInfoOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>
    >,
  ) => {
    const messageContext = useChannelInfoOverlayContext<
      At,
      Ch,
      Co,
      Ev,
      Me,
      Re,
      Us
    >();

    return <Component {...(props as P)} {...messageContext} />;
  };
  WithChannelInfoOverlayContextComponent.displayName = `WithChannelInfoOverlayContext${getDisplayName(
    Component,
  )}`;
  return WithChannelInfoOverlayContextComponent;
};
