import React, { PropsWithChildren, useContext } from 'react';

import type {
  GestureResponderEvent,
  TouchableOpacityProps,
} from 'react-native';

import { getDisplayName } from '../utils/getDisplayName';

import type { UnknownType } from '../../types/types';

export type MessageContentContextValue = {
  onLongPress: (event: GestureResponderEvent) => void;
  additionalTouchableProps?: Omit<TouchableOpacityProps, 'style'>;
  disabled?: boolean;
};

export const MessageContentContext = React.createContext(
  {} as MessageContentContextValue,
);

export const MessageContentProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: MessageContentContextValue;
}>) => (
  <MessageContentContext.Provider
    value={(value as unknown) as MessageContentContextValue}
  >
    {children}
  </MessageContentContext.Provider>
);

export const useMessageContentContext = () =>
  (useContext(MessageContentContext) as unknown) as MessageContentContextValue;

/**
 * Typescript currently does not support partial inference so if MessageContentContext
 * typing is desired while using the HOC withMessageContentContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageContentContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof MessageContentContextValue>> => {
  const WithMessageContentContextComponent = (
    props: Omit<P, keyof MessageContentContextValue>,
  ) => {
    const messageContentContext = useMessageContentContext();

    return <Component {...(props as P)} {...messageContentContext} />;
  };
  WithMessageContentContextComponent.displayName = `WithMessageContentContext${getDisplayName(
    Component,
  )}`;
  return WithMessageContentContextComponent;
};
