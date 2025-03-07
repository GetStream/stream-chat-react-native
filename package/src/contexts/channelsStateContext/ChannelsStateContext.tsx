import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { ActiveChannelsProvider } from '../activeChannelsRefContext/ActiveChannelsRefContext';

import type { ThreadContextValue } from '../threadContext/ThreadContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelState = {
  threadMessages: ThreadContextValue['threadMessages'];
};

type ChannelsState = {
  [cid: string]: ChannelState;
};

export type Keys = keyof ChannelState;

export type Payload<Key extends Keys = Keys> = {
  cid: string;
  key: Key;
  value: ChannelState[Key];
};

type SetStateAction = {
  payload: Payload;
  type: 'SET_STATE';
};

type Action = SetStateAction;

export type ChannelsStateContextValue = {
  setState: (value: Payload) => void;
  state: ChannelsState;
};

type Reducer = (state: ChannelsState, action: Action) => ChannelsState;

function reducer(state: ChannelsState, action: Action) {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...state,
        [action.payload.cid]: {
          ...(state[action.payload.cid] || {}),
          [action.payload.key]: action.payload.value,
        },
      };

    default:
      throw new Error();
  }
}

const ChannelsStateContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelsStateContextValue,
);

export const ChannelsStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer as unknown as Reducer, {});

  const setState = useCallback((payload: Payload) => {
    dispatch({ payload, type: 'SET_STATE' });
  }, []);

  const value = useMemo(
    () => ({
      setState,
      state,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
  );

  const activeChannelsRef = useRef(Object.keys(state));

  useEffect(() => {
    activeChannelsRef.current = Object.keys(state);
  }, [state]);

  return (
    <ChannelsStateContext.Provider value={value as unknown as ChannelsStateContextValue}>
      <ActiveChannelsProvider value={activeChannelsRef}>{children}</ActiveChannelsProvider>
    </ChannelsStateContext.Provider>
  );
};

export const useChannelsStateContext = () => {
  const contextValue = useContext(ChannelsStateContext) as unknown as ChannelsStateContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelsStateContext hook was called outside the ChannelStateContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    );
  }

  return contextValue;
};
