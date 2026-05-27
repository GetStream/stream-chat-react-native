import React, { useCallback, useMemo, useState } from 'react';

import { KeyboardAvoidingView, Platform, Pressable, Text } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { Channel, UserResponse } from 'stream-chat';
import {
  ChannelAddMembers,
  ChannelDetailsContext,
  NotificationList,
  NotificationTargetProvider,
  useChannelActions,
} from 'stream-chat-react-native-core';

import type { StackNavigatorParamList } from '../types';

type ChannelAddMembersScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'ChannelAddMembersScreen'
>;

type ChannelAddMembersScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'ChannelAddMembersScreen'
>;

type Props = {
  navigation: ChannelAddMembersScreenNavigationProp;
  route: ChannelAddMembersScreenRouteProp;
};

type ChannelAddMembersScreenContentProps = {
  channel: Channel;
  goBack: () => void;
};

const ChannelAddMembersScreenContent: React.FC<ChannelAddMembersScreenContentProps> = ({
  channel,
  goBack,
}) => {
  const { addMembers } = useChannelActions(channel);
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);

  const onSavePress = useCallback(async () => {
    await addMembers(
      selectedUsers.map((user) => user.id),
      {
        onSuccess: () => {
          setSelectedUsers([]);
          goBack();
        },
      },
    );
  }, [addMembers, selectedUsers, goBack]);

  return (
    <>
      <ChannelAddMembers onSelectionChange={setSelectedUsers} />
      <Pressable onPress={onSavePress} style={{ alignItems: 'center', padding: 16 }}>
        <Text>Save</Text>
      </Pressable>
      <NotificationList />
    </>
  );
};

export const ChannelAddMembersScreen: React.FC<Props> = ({
  navigation,
  route: {
    params: { channel },
  },
}) => {
  const channelDetailsContextValue = useMemo(() => ({ channel }), [channel]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <ChannelDetailsContext.Provider value={channelDetailsContextValue}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <NotificationTargetProvider hostId={channel.cid} panel='channel-details'>
            <ChannelAddMembersScreenContent channel={channel} goBack={goBack} />
          </NotificationTargetProvider>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ChannelDetailsContext.Provider>
  );
};
