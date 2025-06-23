import React, { PropsWithChildren } from 'react';
import {
  Chat,
  OverlayProvider,
  SqliteClient,
  Streami18n,
  useCreateChatClient,
} from 'stream-chat-expo';
import { AuthProgressLoader } from './AuthProgressLoader';
import { STREAM_API_KEY, user, userToken } from '../constants';
import { useStreamChatTheme } from '../useStreamChatTheme';

const streami18n = new Streami18n({
  language: 'en',
});

SqliteClient.logger = (level, message, extraData) => {
  // console.log(level, `SqliteClient: ${message}`, extraData);
};

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
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
    <OverlayProvider i18nInstance={streami18n} value={{ style: theme }}>
      <Chat client={chatClient} i18nInstance={streami18n}>
        {children}
      </Chat>
    </OverlayProvider>
  );
};
