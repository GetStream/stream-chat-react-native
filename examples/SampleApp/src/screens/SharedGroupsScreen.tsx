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
  ChannelPreviewMessengerProps,
  Chat,
  getChannelPreviewDisplayAvatar,
  getChannelPreviewDisplayName,
  useChannelPreviewDisplayName,
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
  StackNavigatorParamList,
} from '../types';
import { RouteProp, useNavigation, useTheme } from '@react-navigation/native';

const CustomPreview: React.FC<
  ChannelPreviewMessengerProps<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalResponseType,
    LocalUserType
  >
> = ({ channel }) => {
  const { chatClient } = useContext(AppContext);
  const name = useChannelPreviewDisplayName(channel, 40);
  const navigation = useNavigation();
  const { colors } = useTheme() as AppTheme;

  if (!chatClient) return null;

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
        <Text style={{ marginLeft: 8 }}>{name}</Text>
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
};

type SharedGroupsScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'SharedGroupsScreen'
>;

type SharedGroupsScreenProps = {
  route: SharedGroupsScreenRouteProp;
};

export const SharedGroupsScreen: React.FC<SharedGroupsScreenProps> = ({
  route: {
    params: { user },
  },
}) => {
  const { chatClient } = useContext(AppContext);

  if (!chatClient?.user) return null;

  return (
    <>
      <ScreenHeader title={'Shared Groups'} />
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
        Preview={CustomPreview}
        sort={{
          last_message_at: -1,
        }}
      />
    </>
  );
};
