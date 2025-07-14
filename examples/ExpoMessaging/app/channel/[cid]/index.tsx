import React, { useContext } from 'react';
import { SafeAreaView, View } from 'react-native';
import { Channel, MessageInput, MessageList } from 'stream-chat-expo';
import { Stack, useRouter } from 'expo-router';
import { AuthProgressLoader } from '../../../components/AuthProgressLoader';
import { AppContext } from '../../../context/AppContext';
import { useHeaderHeight } from '@react-navigation/elements';
import InputButtons from '../../../components/InputButtons';
import { isAttachmentEqualHandler, LocationCard } from '../../../components/LocationCard';
import { MessageLocation } from '../../../components/MessageLocation';

export default function ChannelScreen() {
  const router = useRouter();
  const { setThread, channel, thread } = useContext(AppContext);
  const headerHeight = useHeaderHeight();

  if (!channel) {
    return <AuthProgressLoader />;
  }

  const onPressMessage: NonNullable<React.ComponentProps<typeof Channel>['onPressMessage']> = (
    payload,
  ) => {
    const { message, defaultHandler, emitter } = payload;
    const { latitude, longitude, ended_at } = message.attachments?.[0] || {};
    if (emitter === 'messageContent') {
      if (message?.attachments?.[0]?.type === 'location') {
        router.push(
          `/map/${message.id}?latitude=${latitude}&longitude=${longitude}&ended_at=${ended_at}`,
        );
      }
    }
    defaultHandler?.();
  };

  return (
    <SafeAreaView>
      <Stack.Screen options={{ title: 'Channel Screen' }} />
      {channel && (
        <Channel
          audioRecordingEnabled={true}
          Card={LocationCard}
          channel={channel}
          isAttachmentEqual={isAttachmentEqualHandler}
          keyboardVerticalOffset={headerHeight}
          MessageLocation={MessageLocation}
          onPressMessage={onPressMessage}
          thread={thread}
        >
          <View style={{ flex: 1 }}>
            <MessageList
              onThreadSelect={(thread) => {
                setThread(thread);
                router.push(`/channel/${channel.cid}/thread/${thread.cid}`);
              }}
            />
            <MessageInput InputButtons={InputButtons} />
          </View>
        </Channel>
      )}
    </SafeAreaView>
  );
}
