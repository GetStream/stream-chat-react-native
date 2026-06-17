import React, { useCallback, useContext } from 'react';
import { Pressable } from 'react-native';

import { Stack, useRouter } from 'expo-router';

import {
  ChannelDetailsContextProvider,
  PinnedMessageItem,
  PinnedMessageItemProps,
  PinnedMessageList,
  useTheme,
  WithComponents,
} from 'stream-chat-expo';

import { AppContext } from '../../../../context/AppContext';

/**
 * Custom pinned-message row that navigates back to the parent channel screen
 * with the tapped message's id, so the message list scrolls to and highlights
 * the message. Mirrors SampleApp's behavior.
 */
const PinnedMessage = (props: PinnedMessageItemProps) => {
  const router = useRouter();
  const onPress = useCallback(() => {
    const channelCid = props.channel?.cid;
    if (!channelCid) return;
    const targetId = props.message.parent_id ?? props.message.id;
    router.replace(`/channel/${channelCid}?messageId=${targetId}`);
  }, [props.channel, props.message.parent_id, props.message.id, router]);

  return (
    <Pressable onPress={onPress}>
      <PinnedMessageItem {...props} />
    </Pressable>
  );
};

export default function ChannelPinnedMessagesScreen() {
  const {
    theme: { semantics },
  } = useTheme();
  const { channel } = useContext(AppContext);

  if (!channel) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ contentStyle: { backgroundColor: semantics.backgroundCoreApp } }} />
      <ChannelDetailsContextProvider value={{ channel }}>
        <WithComponents overrides={{ PinnedMessageItem: PinnedMessage }}>
          <PinnedMessageList />
        </WithComponents>
      </ChannelDetailsContextProvider>
    </>
  );
}
