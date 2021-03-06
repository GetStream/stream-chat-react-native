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
) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // eslint-disable-next-line no-underscore-dangle
      await client._setupConnection();
    } else if (nextAppState.match(/inactive|background/)) {
      await client.wsConnection?.disconnect();

      for (const cid in client.activeChannels) {
        const channel = client.activeChannels[cid];
        channel.state.setIsUpToDate(false);
      }
    }

    appState.current = nextAppState;
  };
};
