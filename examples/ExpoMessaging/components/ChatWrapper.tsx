import React, { PropsWithChildren } from 'react';
import { Chat, OverlayProvider, Streami18n } from 'stream-chat-expo';
import { useChatClient } from '../hooks/useChatClient';
import { AuthProgressLoader } from './AuthProgressLoader';
import { StreamChatGenerics } from '../types';

const STREAM_API_KEY = 'q95x9hkbyd6p';
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';
const user = {
  id: 'ron',
};
const streami18n = new Streami18n({
  language: 'en',
});

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
  const chatClient = useChatClient({
    apiKey: STREAM_API_KEY,
    userData: user,
    tokenOrProvider: userToken,
  });

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <OverlayProvider<StreamChatGenerics> i18nInstance={streami18n}>
      <Chat client={chatClient} i18nInstance={streami18n} enableOfflineSupport={true}>
        {children}
      </Chat>
    </OverlayProvider>
  );
};
