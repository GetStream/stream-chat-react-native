import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { Channel, Thread } from 'stream-chat-react-native/v2';

import { ScreenHeader } from '../components/ScreenHeader';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

type ThreadScreenRouteProp = RouteProp<StackNavigatorParamList, 'ThreadScreen'>;

type ThreadScreenProps = {
  route: ThreadScreenRouteProp;
};
export const ThreadScreen: React.FC<ThreadScreenProps> = ({
  route: {
    params: { channel, thread },
  },
}) => (
  <SafeAreaView style={{ flex: 1 }}>
    <Channel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalResponseType,
      LocalUserType
    >
      channel={channel}
      enforceUniqueReaction
      keyboardVerticalOffset={0}
      thread={thread}
    >
      <View style={styles.container}>
        <ScreenHeader
          inSafeArea
          subtitle={`with ${thread?.user?.name}`}
          title={'Thread Reply'}
        />
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
  </SafeAreaView>
);
