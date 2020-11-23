import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ChannelSort } from 'stream-chat';
import { ChannelList, Chat } from 'stream-chat-react-native/v2';
import { AppContext } from '../context/AppContext';
import {
  AppTheme,
  BottomTabNavigatorParamList,
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';
import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

const filters = {
  type: 'messaging',
};
const sort: ChannelSort<LocalChannelType> = { last_message_at: -1 };
const options = {
  presence: true,
  state: true,
  watch: true,
};

type ChannelListScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabNavigatorParamList, 'ChannelListScreen'>,
  StackNavigationProp<StackNavigatorParamList>
>;

// type Props = {
//   navigation: ChannelListScreenNavigationProp;
// };

export const ChannelListScreen: React.FC = () => {
  const { chatClient } = useContext(AppContext);
  const { colors } = useTheme() as AppTheme;
  const navigation = useNavigation<ChannelListScreenNavigationProp>();

  if (!chatClient) return null;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ChatScreenHeader />

        <View style={styles.listContainer}>
          <Chat client={chatClient}>
            <View>
              <ChannelList<
                LocalAttachmentType,
                LocalChannelType,
                LocalCommandType,
                LocalEventType,
                LocalMessageType,
                LocalResponseType,
                LocalUserType
              >
                filters={{
                  ...filters,
                  members: {
                    $in: [chatClient.user?.id || ''],
                  },
                }}
                onSelect={(channel) => {
                  navigation.navigate('ChannelScreen', {
                    channelId: channel.id,
                  });
                }}
                options={options}
                sort={sort}
              />
            </View>
          </Chat>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
  },
  listContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
