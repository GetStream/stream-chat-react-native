import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

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
import { ActiveChannelsProvider } from '../activeChannelsRefContext/ActiveChannelsRefContext';

import type { ChannelContextValue } from '../channelContext/ChannelContext';
import type { PaginatedMessageListContextValue } from '../paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../threadContext/ThreadContext';
import type { TypingContextValue } from '../typingContext/TypingContext';
import { getDisplayName } from '../utils/getDisplayName';

export type ChannelState<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  members: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['members'];
  messages: PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>['messages'];
  read: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read'];
  subscriberCount: number;
  threadMessages: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['threadMessages'];
  typing: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>['typing'];
  watcherCount: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['watcherCount'];
  watchers: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
};

type ChannelsState<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = { [cid: string]: ChannelState<At, Ch, Co, Ev, Me, Re, Us> };

export type Keys = keyof ChannelState;

export type Payload<
  Key extends Keys = Keys,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  cid: string;
  key: Key;
  value: ChannelState<At, Ch, Co, Ev, Me, Re, Us>[Key];
};

type SetStateAction<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = { payload: Payload<Keys, At, Ch, Co, Ev, Me, Re, Us>; type: 'SET_STATE' };

type IncreaseSubscriberCountAction = {
  payload: { cid: string };
  type: 'INCREASE_SUBSCRIBER_COUNT';
};
type DecreaseSubscriberCountAction = {
  payload: { cid: string };
  type: 'DECREASE_SUBSCRIBER_COUNT';
};

type Action<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> =
  | SetStateAction<At, Ch, Co, Ev, Me, Re, Us>
  | IncreaseSubscriberCountAction
  | DecreaseSubscriberCountAction;

export type ChannelsStateContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  decreaseSubscriberCount: (value: { cid: string }) => void;
  increaseSubscriberCount: (value: { cid: string }) => void;
  setState: (value: Payload<Keys, At, Ch, Co, Ev, Me, Re, Us>) => void;
  state: ChannelsState<At, Ch, Co, Ev, Me, Re, Us>;
};

type Reducer<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = (
  state: ChannelsState<At, Ch, Co, Ev, Me, Re, Us>,
  action: Action<At, Ch, Co, Ev, Me, Re, Us>,
) => ChannelsState<At, Ch, Co, Ev, Me, Re, Us>;

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

const ChannelsStateContext = React.createContext<ChannelsStateContextValue | undefined>(undefined);

export const ChannelsStateProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer as Reducer<At, Ch, Co, Ev, Me, Re, Us>, {});

  const setState = useCallback((payload: Payload<Keys, At, Ch, Co, Ev, Me, Re, Us>) => {
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  componentName?: string,
) => {
  const contextValue = useContext(ChannelsStateContext) as unknown as ChannelsStateContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

  if (!contextValue) {
    console.warn(
      `The useChannelStateContext hook was called outside the ChannelStateContext Provider. Make sure this hook is called within a child of the OverlayProvider component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ChannelsStateContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }

  return contextValue as ChannelsStateContextValue<At, Ch, Co, Ev, Me, Re, Us>;
};

export const withChannelsStateContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChannelsStateContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChannelsStateContextComponent = (
    props: Omit<P, keyof ChannelsStateContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const channelsStateContext = useChannelsStateContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelsStateContext} />;
  };
  WithChannelsStateContextComponent.displayName = `WithChannelsStateContext${getDisplayName(
    Component,
  )}`;
  return WithChannelsStateContextComponent;
};
