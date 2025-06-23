import React, { PropsWithChildren, useRef } from 'react';
import {
  Chat,
  OverlayProvider,
  SqliteClient,
  Streami18n,
  useCreateChatClient,
} from 'stream-chat-expo';
import { AuthProgressLoader } from './AuthProgressLoader';
import { STREAM_API_KEY, user, userToken } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStreamChatTheme } from '../useStreamChatTheme';

const streami18n = new Streami18n({
  language: 'en',
});

SqliteClient.logger = (level, message, extraData) => {
  // console.log(level, `SqliteClient: ${message}`, extraData);
};

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { bottom } = useSafeAreaInsets();
  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    userData: user,
    tokenOrProvider: userToken,
  });
  const theme = useStreamChatTheme();

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <OverlayProvider
      bottomInset={bottom}
      i18nInstance={streami18n}
      value={{ style: theme }}
    >
      <Chat enableOfflineSupport client={chatClient} i18nInstance={streami18n}>
        {children}
      </Chat>
    </OverlayProvider>
  );
};
