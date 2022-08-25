import React, { PropsWithChildren, useContext, useRef } from 'react';

import type { Channel, ChannelState, StreamChat } from 'stream-chat';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { DefaultStreamChatGenerics } from '../../types/types';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type DebugDataType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> =
  | StreamChat<StreamChatGenerics>['user']
  | {
      data: Channel<StreamChatGenerics>['data'];
      members: ChannelState<StreamChatGenerics>['members'];
    }[]
  | MessageType<StreamChatGenerics>[];

export type DebugContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  eventType?: string;
  sendEventParams?: {
    action: string;
    data: DebugDataType<StreamChatGenerics>;
  };
  setEventType?: (data: string) => void;
  setSendEventParams?: (data: { action: string; data: DebugDataType<StreamChatGenerics> }) => void;
};

export const DebugContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as React.MutableRefObject<DebugContextValue>,
);

export const DebugContextProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  useFlipper,
}: PropsWithChildren<{
  useFlipper: () => {
    updateData: (ref: React.RefObject<DebugContextValue<StreamChatGenerics>>) => void;
  };
}>) => {
  const debugRef = useRef<DebugContextValue<StreamChatGenerics>>({
    eventType: undefined,
    sendEventParams: undefined,
  });

  const { updateData } = useFlipper();

  const ref = useRef<DebugContextValue<StreamChatGenerics>>({
    setEventType: (data: string) => {
      debugRef.current.eventType = data;
      updateData(debugRef);
    },
    setSendEventParams: (data: { action: string; data: DebugDataType<StreamChatGenerics> }) => {
      debugRef.current.sendEventParams = data;
      updateData(debugRef);
    },
  });

  return (
    <DebugContext.Provider value={ref as unknown as React.MutableRefObject<DebugContextValue>}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebugContext = () => {
  const contextValue = useContext(
    DebugContext,
  ) as unknown as React.MutableRefObject<DebugContextValue>;

  return contextValue;
};
