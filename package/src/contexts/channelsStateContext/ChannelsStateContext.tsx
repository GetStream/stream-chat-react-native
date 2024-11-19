import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { ActiveChannelsProvider } from '../activeChannelsRefContext/ActiveChannelsRefContext';

import type { ThreadContextValue } from '../threadContext/ThreadContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  threadMessages: ThreadContextValue<StreamChatGenerics>['threadMessages'];
};

type ChannelsState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  [cid: string]: ChannelState<StreamChatGenerics>;
};

export type Keys = keyof ChannelState;

export type Payload<
  Key extends Keys = Keys,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  cid: string;
  key: Key;
  value: ChannelState<StreamChatGenerics>[Key];
};

type SetStateAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  payload: Payload<Keys, StreamChatGenerics>;
  type: 'SET_STATE';
};

type Action<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  SetStateAction<StreamChatGenerics>;

export type ChannelsStateContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  setState: (value: Payload<Keys, StreamChatGenerics>) => void;
  state: ChannelsState<StreamChatGenerics>;
};

type Reducer<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = (
  state: ChannelsState<StreamChatGenerics>,
  action: Action<StreamChatGenerics>,
) => ChannelsState<StreamChatGenerics>;

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

export const ChannelsStateProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer as unknown as Reducer<StreamChatGenerics>, {});

  const setState = useCallback((payload: Payload<Keys, StreamChatGenerics>) => {
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

export const useChannelsStateContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    ChannelsStateContext,
  ) as unknown as ChannelsStateContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useChannelsStateContext hook was called outside the ChannelStateContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider`,
    );
  }

  return contextValue;
};
