import React, { useContext, useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/stack';
import { Channel, Chat, Thread } from 'stream-chat-react-native/v2';
import { AppContext } from '../context/AppContext';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  ThreadRoute,
} from '../types';
import { streamTheme } from '../utils/streamTheme';

export type ThreadScreenProps = {
  route: RouteProp<ThreadRoute, 'Thread'>;
};

export const ThreadScreen: React.FC<ThreadScreenProps> = ({ route }) => {
  const { chatClient, thread } = useContext(AppContext);
  const [channel] = useState(
    chatClient.channel('messaging', route.params.channelId),
  );
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView>
      <Chat client={chatClient} style={streamTheme}>
        <Channel
          channel={channel}
          keyboardVerticalOffset={headerHeight}
          thread={thread}
        >
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
      </Chat>
    </SafeAreaView>
  );
};
