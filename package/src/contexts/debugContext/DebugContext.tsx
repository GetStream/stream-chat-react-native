import React, { PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

import type { Channel } from 'stream-chat';

import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type DebugContextValue = {
  eventType?: string;
  receiveEventParams?: {
    listener: (params: any) => Promise<any>;
    methodName: string;
  };
  sendEventParams?: {
    action: string;
    data: any;
  };
  setEventType?: (data: string) => void;
  setSendEventParams?: (data: { action: string; data: any }) => void;
};

export const DebugContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as React.MutableRefObject<DebugContextValue>,
);

export const DebugContextProvider = ({
  children,
  useFlipper,
}: PropsWithChildren<{
  useFlipper: () => { updateData: (ref: React.RefObject<DebugContextValue>) => void };
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
    setSendEventParams: (data: any) => {
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
