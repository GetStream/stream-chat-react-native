import React, { PropsWithChildren } from 'react';

import { UserResponse } from 'stream-chat';
import {
  Chat,
  type LooseTranslationDictionary,
  OverlayProvider,
  SqliteClient,
  Streami18n,
  useCreateChatClient,
  WithComponents,
} from 'stream-chat-expo';

import { AuthProgressLoader } from './AuthProgressLoader';

import { useExpoMessagingComponentOverrides } from './ExpoMessagingComponentOverrides';

import { useStreamChatTheme } from '../hooks/useStreamChatTheme';

import { STREAM_API_KEY, USER_TOKENS } from '@/constants/ChatUsers';
import { useUserContext } from '@/context/UserContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import '../utils/backgroundMessageHandler';

const streami18n = new Streami18n({
  language: 'en',
});

// A key the app owns rather than the SDK. `TranslationDictionary` only accepts the SDK's own keys,
// so annotating the variable with `LooseTranslationDictionary` is how you opt into your own —
// at the cost of no longer catching a stale or mistyped SDK key in this object.
//
// The `duration.` prefix is load-bearing twice over: `t()` matches formatter keys by prefix, so it
// is what lets the call site stay a plain literal instead of needing `asDynamicKey`, and it names
// the expression for what it actually is. This was `timestamp/Location end at` under v9 — a
// duration expression filed under `timestamp`, fed `milliseconds` by its one caller.
const appTranslations: LooseTranslationDictionary = {
  'duration.locationEndAt': '{{ milliseconds | durationFormatter(withSuffix: false) }}',
};

// Registered once at module scope; calling this from a component body re-registers on every render.
streami18n.registerTranslation('en', appTranslations);

SqliteClient.logger = (_level, _message, _extraData) => {
  // console.log(_level, `SqliteClient: ${_message}`, _extraData);
};

export const ChatWrapper = ({ children }: PropsWithChildren) => {
  const { user } = useUserContext();
  const chatClient = useCreateChatClient({
    apiKey: STREAM_API_KEY,
    userData: user as UserResponse,
    tokenOrProvider: USER_TOKENS[user?.id as string],
  });

  usePushNotifications({ chatClient });

  const theme = useStreamChatTheme();
  const componentOverrides = useExpoMessagingComponentOverrides();

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <WithComponents overrides={componentOverrides}>
      <OverlayProvider
        accessibility={{ enabled: true }}
        i18nInstance={streami18n}
        value={{ style: theme }}
      >
        <Chat
          client={chatClient}
          i18nInstance={streami18n}
          enableOfflineSupport
          useNativeMultipartUpload
        >
          {children}
        </Chat>
      </OverlayProvider>
    </WithComponents>
  );
};
