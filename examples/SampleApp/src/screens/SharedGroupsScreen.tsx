import React, { useEffect, useRef } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Channel, UserResponse } from 'stream-chat';
import {
  Avatar,
  ChannelList,
  Chat,
  getChannelPreviewDisplayAvatar,
  getChannelPreviewDisplayName,
} from '../../../../src/v2';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppContext } from '../context/AppContext';
import truncate from 'lodash/truncate';

import {
  AppTheme,
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
} from '../types';
import { useNavigation, useTheme } from '@react-navigation/native';

export const SharedGroupsScreen = ({
  route: {
    params: { user },
  },
}) => {
  const { chatClient } = useContext(AppContext);
  const { colors } = useTheme() as AppTheme;
  const navigation = useNavigation();

  if (!chatClient) return null;

  return (
    <>
      <ScreenHeader title={'Shared Groups'} />
      <Chat client={chatClient}>
        <ChannelList
          filters={{
            $and: [
              { members: { $in: [chatClient?.user?.id] } },
              { members: { $in: [user.id] } },
            ],
          }}
          onSelect={() => null}
          options={{
            watch: false,
          }}
          Preview={({ channel, onSelect }) => {
            if (Object.keys(channel.state.members).length === 2) return null;
            return (
              <TouchableOpacity
                onPress={() => {
                  navigation.reset({
                    index: 1,
                    routes: [
                      {
                        name: 'ChatScreen',
                      },
                      {
                        name: 'ChannelScreen',
                        params: {
                          channelId: channel.id,
                        },
                      },
                    ],
                  });
                }}
                style={{
                  alignItems: 'center',
                  borderBottomColor: colors.borderLight,
                  borderBottomWidth: 1,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 12,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 12,
                  width: '100%',
                }}
              >
                <View
                  style={{
                    alignItems: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <Avatar
                    {...getChannelPreviewDisplayAvatar(channel, chatClient)}
                    size={40}
                  />
                  <Text style={{ marginLeft: 8 }}>
                    {truncate(
                      getChannelPreviewDisplayName(channel, chatClient),
                      {
                        length: 40,
                      },
                    )}
                  </Text>
                </View>
                <View
                  style={{
                    alignItems: 'flex-end',
                  }}
                >
                  <Text
                    style={{
                      color: colors.textLight,
                    }}
                  >
                    {Object.keys(channel.state.members).length} Members
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          sort={{
            last_message_at: -1,
          }}
        />
      </Chat>
    </>
  );
};
