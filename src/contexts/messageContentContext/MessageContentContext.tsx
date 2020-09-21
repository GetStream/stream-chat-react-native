import React, { PropsWithChildren, useContext } from 'react';

import type {
  GestureResponderEvent,
  TouchableOpacityProps,
} from 'react-native';
import type { UnknownType } from 'stream-chat';

import { getDisplayName } from '../utils/getDisplayName';

import type { MessageWithDates } from '../messagesContext/MessagesContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type MessageContentContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  onLongPress: (
    message: MessageWithDates<At, Ch, Co, Me, Re, Us>,
    event: GestureResponderEvent,
  ) => void;
  additionalTouchableProps?: TouchableOpacityProps;
  disabled?: boolean;
};

export const MessageContentContext = React.createContext(
  {} as MessageContentContextValue,
);

export const MessageContentProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: MessageContentContextValue<At, Ch, Co, Me, Re, Us>;
}>) => (
  <MessageContentContext.Provider
    value={(value as unknown) as MessageContentContextValue}
  >
    {children}
  </MessageContentContext.Provider>
);

export const useMessageContentContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(MessageContentContext) as unknown) as MessageContentContextValue<
    At,
    Ch,
    Co,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if MessageContentContext
 * typing is desired while using the HOC withMessageContentContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageContentContext = <
  P extends Record<string, unknown>,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<
  Omit<P, keyof MessageContentContextValue<At, Ch, Co, Me, Re, Us>>
> => {
  const WithMessageContentContextComponent = (
    props: Omit<P, keyof MessageContentContextValue<At, Ch, Co, Me, Re, Us>>,
  ) => {
    const messageContentContext = useMessageContentContext<
      At,
      Ch,
      Co,
      Me,
      Re,
      Us
    >();

    return <Component {...(props as P)} {...messageContentContext} />;
  };
  WithMessageContentContextComponent.displayName = `WithMessageContentContext${getDisplayName(
    Component,
  )}`;
  return WithMessageContentContextComponent;
};
