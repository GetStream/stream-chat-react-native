import React, { useContext } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useTheme } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AppContext } from '../context/AppContext';
import { NavigationParamsList } from '../types';
import { streamTheme } from '../utils/streamTheme';
import { LeftArrow } from '../icons/LeftArrow';

import {
  Channel,
  ChannelList,
  Chat,
  DeepPartial,
  MessageInput,
  MessageList,
  OverlayProvider,
  Streami18n,
  Theme,
  Thread,
  ThreadContextValue,
} from 'stream-chat-react-native/v2';

export type ChannelScreenProps = {
  navigation: StackNavigationProp<NavigationParamsList, 'Channel'>;
  route: RouteProp<NavigationParamsList, 'Channel'>;
};

export type ChannelHeaderProps = {
  title: string;
};

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ title }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: colors.backgroundNavigation,
          height: 55,
        },
      ]}
    >
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <LeftArrow height={24} width={24} />
      </TouchableOpacity>
      <Text
        style={[
          styles.headerTitle,
          {
            color: colors.text,
          },
        ]}
      >
        {title}
      </Text>
      <TouchableOpacity />
    </View>
  );
};

export const ChannelScreen: React.FC<ChannelScreenProps> = ({ route: {params: {channelId}} }) => {
  const { chatClient } = useContext(AppContext);
  const channel = chatClient?.channel('messaging', channelId);
  return (
    <SafeAreaView>
      <Chat client={chatClient} style={streamTheme}>
        <View style={{ height: '100%' }}>
          <ChannelHeader title={'User'} />
          <Chat client={chatClient}>
            <Channel channel={channel}>
              <View style={{ flex: 1 }}>
                <MessageList<
                  LocalAttachmentType,
                  LocalChannelType,
                  LocalCommandType,
                  LocalEventType,
                  LocalMessageType,
                  LocalResponseType,
                  LocalUserType
                >
                  onThreadSelect={(thread) => {
                    setThread(thread);
                    if (channel?.id) {
                      navigation.navigate('Thread', { channelId: channel.id });
                    }
                  }}
                />
                <MessageInput />
              </View>
            </Channel>
          </Chat>
        </View>
      </Chat>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    borderBottomColor: 'rgba(0, 0, 0, 0.0677)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
