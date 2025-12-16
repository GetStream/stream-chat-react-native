import React, { PropsWithChildren } from 'react';
import {
  Chat,
  enTranslations,
  OverlayProvider,
  SqliteClient,
  Streami18n,
  useCreateChatClient,
} from 'stream-chat-expo';
import { AuthProgressLoader } from './AuthProgressLoader';
import { useStreamChatTheme } from '../hooks/useStreamChatTheme';
import { useUserContext } from '@/context/UserContext';
import { STREAM_API_KEY, USER_TOKENS } from '@/constants/ChatUsers';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import '../utils/backgroundMessageHandler';

const streami18n = new Streami18n({
  language: 'en',
});

SqliteClient.logger = (level, message, extraData) => {
  // console.log(level, `SqliteClient: ${message}`, extraData);
};

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { user } = useUserContext();
  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    userData: user,
    tokenOrProvider: USER_TOKENS[user?.id as string],
  });

  usePushNotifications({ chatClient });

  streami18n.registerTranslation('en', {
    ...enTranslations,
    'timestamp/Location end at': '{{ milliseconds | durationFormatter(withSuffix: false) }}',
  });

  const theme = useStreamChatTheme();

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <OverlayProvider i18nInstance={streami18n} value={{ style: theme }}>
      <Chat client={chatClient} i18nInstance={streami18n} enableOfflineSupport>
        {children}
      </Chat>
    </OverlayProvider>
  );
};
