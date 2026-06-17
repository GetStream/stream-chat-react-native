import React, { useCallback, useContext } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';

import {
  ChannelDetailsContextProvider,
  PinnedMessageItem,
  PinnedMessageItemProps,
  PinnedMessageList,
  useTheme,
  WithComponents,
} from 'stream-chat-expo';

import { ScreenHeader } from '../../../../components/ScreenHeader';
import { AppContext } from '../../../../context/AppContext';

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

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
  useTheme();
  const { channel } = useContext(AppContext);

  if (!channel) {
    return null;
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader titleText='Pinned Messages' />
      <ChannelDetailsContextProvider value={{ channel }}>
        <WithComponents overrides={{ PinnedMessageItem: PinnedMessage }}>
          <PinnedMessageList />
        </WithComponents>
      </ChannelDetailsContextProvider>
    </View>
  );
}
