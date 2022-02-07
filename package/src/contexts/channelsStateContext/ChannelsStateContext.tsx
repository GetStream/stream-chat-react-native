import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import type { ExtendableGenerics } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { ActiveChannelsProvider } from '../activeChannelsRefContext/ActiveChannelsRefContext';

import type { ChannelContextValue } from '../channelContext/ChannelContext';
import type { PaginatedMessageListContextValue } from '../paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../threadContext/ThreadContext';
import type { TypingContextValue } from '../typingContext/TypingContext';
import { getDisplayName } from '../utils/getDisplayName';

export type ChannelState<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> =
  {
    members: ChannelContextValue<StreamChatClient>['members'];
    messages: PaginatedMessageListContextValue<StreamChatClient>['messages'];
    read: ChannelContextValue<StreamChatClient>['read'];
    subscriberCount: number;
    threadMessages: ThreadContextValue<StreamChatClient>['threadMessages'];
    typing: TypingContextValue<StreamChatClient>['typing'];
    watcherCount: ChannelContextValue<StreamChatClient>['watcherCount'];
    watchers: ChannelContextValue<StreamChatClient>['watchers'];
  };

type ChannelsState<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  [cid: string]: ChannelState<StreamChatClient>;
};

export type Keys = keyof ChannelState;

export type Payload<
  Key extends Keys = Keys,
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
  cid: string;
  key: Key;
  value: ChannelState<StreamChatClient>[Key];
};

type SetStateAction<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  payload: Payload<Keys, StreamChatClient>;
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

type Action<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> =
  | SetStateAction<StreamChatClient>
  | IncreaseSubscriberCountAction
  | DecreaseSubscriberCountAction;

export type ChannelsStateContextValue<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
  decreaseSubscriberCount: (value: { cid: string }) => void;
  increaseSubscriberCount: (value: { cid: string }) => void;
  setState: (value: Payload<Keys, StreamChatClient>) => void;
  state: ChannelsState<StreamChatClient>;
};

type Reducer<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = (
  state: ChannelsState<StreamChatClient>,
  action: Action<StreamChatClient>,
) => ChannelsState<StreamChatClient>;

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

const ChannelsStateContext = React.createContext({
  removeChannelState: () => {
    // do nothing.
  },
  setState: () => {
    // do nothing.
  },
  state: {},
} as unknown as ChannelsStateContextValue);

export const ChannelsStateProvider = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer as unknown as Reducer<StreamChatClient>, {});

  const setState = useCallback((payload: Payload<Keys, StreamChatClient>) => {
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
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>() => useContext(ChannelsStateContext) as unknown as ChannelsStateContextValue<StreamChatClient>;

export const withChannelsStateContext = <
  P extends UnknownType,
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChannelsStateContextValue<StreamChatClient>>> => {
  const WithChannelsStateContextComponent = (
    props: Omit<P, keyof ChannelsStateContextValue<StreamChatClient>>,
  ) => {
    const channelsStateContext = useChannelsStateContext<StreamChatClient>();

    return <Component {...(props as P)} {...channelsStateContext} />;
  };
  WithChannelsStateContextComponent.displayName = `WithChannelsStateContext${getDisplayName(
    Component,
  )}`;
  return WithChannelsStateContextComponent;
};
