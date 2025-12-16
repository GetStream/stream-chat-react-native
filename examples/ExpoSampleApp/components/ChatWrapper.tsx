import React, { PropsWithChildren } from 'react';
import {
  Chat,
  DeepPartial,
  OverlayProvider,
  Streami18n,
  Theme,
  useCreateChatClient,
} from 'stream-chat-expo';
import { AuthProgressLoader } from '../components/AuthProgressLoader';
import { useStreamChatTheme } from '../hooks/useStreamChatTheme';
import { STREAM_API_KEY, STREAM_USER_DATA, STREAM_USER_TOKEN } from '@/constants';

const streami18n = new Streami18n({
  language: 'en',
});

export const ChatWrapper = ({ children }: PropsWithChildren) => {
  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    userData: STREAM_USER_DATA,
    tokenOrProvider: STREAM_USER_TOKEN,
  });

  const theme: DeepPartial<Theme> = useStreamChatTheme();

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
