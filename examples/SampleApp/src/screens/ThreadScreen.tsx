import React, { useContext, useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/stack';
import { Channel, Chat, Thread } from 'stream-chat-react-native/v2';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';
import { ScreenHeader } from '../components/ScreenHeader';

type ThreadScreenRouteProp = RouteProp<StackNavigatorParamList, 'ThreadScreen'>;

type ThreadScreenProps = {
  route: ThreadScreenRouteProp;
};
export const ThreadScreen: React.FC<ThreadScreenProps> = ({
  route: {
    params: { channel, thread },
  },
}) => {
  const headerHeight = useHeaderHeight();

  return (
    <Channel
      channel={channel}
      enforceUniqueReaction
      keyboardVerticalOffset={headerHeight}
      thread={thread}
    >
      <ScreenHeader
        subtitle={`with ${thread.user?.name}`}
        title={'Thread Reply'}
      />
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-start',
        }}
      >
        <Thread<
          LocalAttachmentType,
          LocalChannelType,
          LocalCommandType,
          LocalEventType,
          LocalMessageType,
          LocalResponseType,
          LocalUserType
        > />
      </View>
    </Channel>
  );
};
