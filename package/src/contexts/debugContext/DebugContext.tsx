import React, { PropsWithChildren, useContext, useRef } from 'react';

import type { Channel, ChannelState, LocalMessage, StreamChat } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type DebugDataType =
  | StreamChat['user']
  | {
      data: Channel['data'];
      members: ChannelState['members'];
    }[]
  | LocalMessage[];

export type DebugContextValue = {
  eventType?: string;
  sendEventParams?: {
    action: string;
    data: DebugDataType;
  };
  setEventType?: (data: string) => void;
  setSendEventParams?: (data: { action: string; data: DebugDataType }) => void;
};

export const DebugContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as React.MutableRefObject<DebugContextValue>,
);

export const DebugContextProvider = ({
  children,
  useFlipper,
}: PropsWithChildren<{
  useFlipper: () => {
    updateData: (ref: React.RefObject<DebugContextValue>) => void;
  };
}>) => {
  const debugRef = useRef<DebugContextValue>({
    eventType: undefined,
    sendEventParams: undefined,
  });

  const { updateData } = useFlipper();

  const ref = useRef<DebugContextValue>({
    setEventType: (data: string) => {
      debugRef.current.eventType = data;
      updateData(debugRef);
    },
    setSendEventParams: (data: { action: string; data: DebugDataType }) => {
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
