import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useTheme,
  PinnedMessageList,
  ChannelDetailsContextProvider,
  PinnedMessageItemProps,
  PinnedMessageItem,
  WithComponents,
} from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  details: {
    flex: 1,
    paddingLeft: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  flex: {
    flex: 1,
  },
  noFiles: {
    fontSize: 16,
    paddingBottom: 8,
  },
  noFilesDetails: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionContainer: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionContentContainer: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 14,
  },
  size: {
    fontSize: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    paddingBottom: 2,
  },
});

type ChannelPinnedMessagesScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'ChannelPinnedMessagesScreen'
>;

type ChannelPinnedMessagesScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'ChannelPinnedMessagesScreen'
>;

export type ChannelPinnedMessagesScreenProps = {
  route: ChannelPinnedMessagesScreenRouteProp;
};

const PinnedMessage = (props: PinnedMessageItemProps) => {
  const navigation = useNavigation<ChannelPinnedMessagesScreenNavigationProp>();

  const onPress = useCallback(() => {
    navigation.navigate('ChannelScreen', {
      channel: props.channel,
      messageId: props.message.parent_id ?? props.message.id,
    });
  }, [props.channel, navigation, props.message.parent_id, props.message.id]);

  return (
    <Pressable onPress={onPress}>
      <PinnedMessageItem {...props} />
    </Pressable>
  );
};

export const ChannelPinnedMessagesScreen: React.FC<ChannelPinnedMessagesScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  useTheme();
  return (
    <View style={[styles.flex]}>
      <ScreenHeader titleText='Pinned Messages' />
      <ChannelDetailsContextProvider channel={channel}>
        <WithComponents overrides={{ PinnedMessageItem: PinnedMessage }}>
          <PinnedMessageList />
        </WithComponents>
      </ChannelDetailsContextProvider>
    </View>
  );
};
