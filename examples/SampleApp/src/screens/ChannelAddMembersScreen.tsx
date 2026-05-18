import React, { useCallback, useState } from 'react';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { StackNavigatorParamList } from '../types';
import {
  ChannelAddMembers,
  ChannelDetailsContext,
  NotificationList,
  NotificationTargetProvider,
  useChannelActions,
} from 'stream-chat-react-native-core';
import type { UserResponse } from 'stream-chat';
import { KeyboardAvoidingView, Platform, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export const ChannelAddMembersScreen: React.FC<Props> = ({
  navigation,
  route: {
    params: { channel },
  },
}) => {
  const { addMembers } = useChannelActions(channel);
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

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
    <ChannelDetailsContext.Provider value={{ channel }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <NotificationTargetProvider hostId={channel.cid} panel='channel-details'>
            <ChannelAddMembers onSelectionChange={setSelectedUsers} />
            <Pressable onPress={onSavePress} style={{ alignItems: 'center', padding: 16 }}>
              <Text>Save</Text>
            </Pressable>
            <NotificationList />
          </NotificationTargetProvider>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ChannelDetailsContext.Provider>
  );
};
