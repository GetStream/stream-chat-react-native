import React, { useContext } from 'react';
import { SafeAreaView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ChannelSort } from 'stream-chat';
import { ChannelList, Chat } from 'stream-chat-react-native/v2';
import { AppContext } from '../context/AppContext';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  NavigationParamsList,
} from '../types';
import streamTheme from '../utils/streamTheme';

const filters = {
  example: 'example-apps',
  members: { $in: ['ron'] },
  type: 'messaging',
};
const sort: ChannelSort<LocalChannelType> = { last_message_at: -1 };
const options = {
  state: true,
  watch: true,
};

export type ChannelListScreenProps = {
  navigation: StackNavigationProp<NavigationParamsList, 'ChannelList'>;
};

export const ChannelListScreen: React.FC<ChannelListScreenProps> = () => {
  const { chatClient, setChannel } = useContext(AppContext);
  const navigation = useNavigation();
  return (
    <SafeAreaView>
      <Chat client={chatClient} style={streamTheme}>
        <View style={{ height: '100%', padding: 10 }}>
          <ChannelList<
            LocalAttachmentType,
            LocalChannelType,
            LocalCommandType,
            LocalEventType,
            LocalMessageType,
            LocalResponseType,
            LocalUserType
          >
            filters={filters}
            onSelect={(channel) => {
              setChannel(channel);
              navigation.navigate('Channel');
            }}
            options={options}
            sort={sort}
          />
        </View>
      </Chat>
    </SafeAreaView>
  );
};
