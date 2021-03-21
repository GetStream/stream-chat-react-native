import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import type { StreamChat } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

/**
 * Disconnect the websocket connection when app goes to background,
 * and reconnect when app comes to foreground.
 * We do this to make sure, user receives push notifications when app is in the background.
 * You can't receive push notification until you have active websocket connection.
 */
export const useAppStateListener = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  closeConnectionOnBackground: boolean,
) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    closeConnectionOnBackground &&
      AppState.addEventListener('change', handleAppStateChange);

    return () => {
      closeConnectionOnBackground &&
        AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [closeConnectionOnBackground]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current === 'background' && nextAppState === 'active') {
      await client.openConnection();
    } else if (
      appState.current.match(/active|inactive/) &&
      nextAppState === 'background'
    ) {
      await client.closeConnection();
      for (const cid in client.activeChannels) {
        const channel = client.activeChannels[cid];
        channel.state.setIsUpToDate(false);
      }
    }

    appState.current = nextAppState;
  };
};
