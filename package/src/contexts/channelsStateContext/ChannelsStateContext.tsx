import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { ActiveChannelsProvider } from '../activeChannelsRefContext/ActiveChannelsRefContext';

import type { ChannelContextValue } from '../channelContext/ChannelContext';
import type { PaginatedMessageListContextValue } from '../paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../threadContext/ThreadContext';
import type { TypingContextValue } from '../typingContext/TypingContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  members: ChannelContextValue<StreamChatGenerics>['members'];
  messages: PaginatedMessageListContextValue<StreamChatGenerics>['messages'];
  read: ChannelContextValue<StreamChatGenerics>['read'];
  subscriberCount: number;
  threadMessages: ThreadContextValue<StreamChatGenerics>['threadMessages'];
  typing: TypingContextValue<StreamChatGenerics>['typing'];
  watcherCount: ChannelContextValue<StreamChatGenerics>['watcherCount'];
  watchers: ChannelContextValue<StreamChatGenerics>['watchers'];
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

type IncreaseSubscriberCountAction = {
  payload: { cid: string };
  type: 'INCREASE_SUBSCRIBER_COUNT';
};
type DecreaseSubscriberCountAction = {
  payload: { cid: string };
  type: 'DECREASE_SUBSCRIBER_COUNT';
};

type Action<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  | SetStateAction<StreamChatGenerics>
  | IncreaseSubscriberCountAction
  | DecreaseSubscriberCountAction;

export type ChannelsStateContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  decreaseSubscriberCount: (value: { cid: string }) => void;
  increaseSubscriberCount: (value: { cid: string }) => void;
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

    case 'INCREASE_SUBSCRIBER_COUNT': {
      const currentCount = state[action.payload.cid]?.subscriberCount ?? 0;
      return {
        ...state,
        [action.payload.cid]: {
          ...(state[action.payload.cid] || {}),
          subscriberCount: currentCount + 1,
        },
      };
    }

    case 'DECREASE_SUBSCRIBER_COUNT': {
      const currentCount = state[action.payload.cid]?.subscriberCount ?? 0;

      // If there last subscribed Channel component unsubscribes, we clear the channel state.
      if (currentCount <= 1) {
        const stateShallowCopy = {
          ...state,
        };

        delete stateShallowCopy[action.payload.cid];

        return stateShallowCopy;
      }

      return {
        ...state,
        [action.payload.cid]: {
          ...(state[action.payload.cid] || {}),
          subscriberCount: currentCount - 1,
        },
      };
    }
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

  const increaseSubscriberCount = useCallback((payload: { cid: string }) => {
    dispatch({ payload, type: 'INCREASE_SUBSCRIBER_COUNT' });
  }, []);

  const decreaseSubscriberCount = useCallback((payload: { cid: string }) => {
    dispatch({ payload, type: 'DECREASE_SUBSCRIBER_COUNT' });
  }, []);

  const value = useMemo(
    () => ({
      decreaseSubscriberCount,
      increaseSubscriberCount,
      setState,
      state,
    }),
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
      `The useChannelStateContext hook was called outside the ChannelStateContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider`,
    );
  }

  return contextValue;
};

export const withChannelsStateContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChannelsStateContextValue<StreamChatGenerics>>> => {
  const WithChannelsStateContextComponent = (
    props: Omit<P, keyof ChannelsStateContextValue<StreamChatGenerics>>,
  ) => {
    const channelsStateContext = useChannelsStateContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...channelsStateContext} />;
  };
  WithChannelsStateContextComponent.displayName = `WithChannelsStateContext${getDisplayName(
    Component,
  )}`;
  return WithChannelsStateContextComponent;
};
