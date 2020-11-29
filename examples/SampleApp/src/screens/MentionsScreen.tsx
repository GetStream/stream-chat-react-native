import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AppTheme, BottomTabNavigatorParamList } from '../types';
import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { usePaginatedMentionedMessages } from '../hooks/usePaginatedMentionedMessages';
import dayjs from 'dayjs';
import { Avatar } from '../../../../src/v2';

export type MentionsScreenProps = {
  navigation: StackNavigationProp<
    BottomTabNavigatorParamList,
    'MentionsScreen'
  >;
};

export const MentionsScreen: React.FC<MentionsScreenProps> = () => {
  const { colors } = useTheme() as AppTheme;
  const { loading, loadMore, messages } = usePaginatedMentionedMessages();
  const navigation = useNavigation();
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
        <View
          style={{
            backgroundColor: colors.background,
            borderColor: 'black',
            flexGrow: 1,
            flexShrink: 1,
          }}
        >
          <FlatList
            data={messages}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ChannelScreen', {
                    channelId: item.channel?.id,
                    messageId: item.id,
                  });
                }}
                style={{ flexDirection: 'row', padding: 12, flex: 1 }}
              >
                <View
                  style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}
                >
                  <Avatar
                    image={item.user?.image}
                    name={item.user?.name}
                    size={40}
                  />
                  <View
                    style={{
                      flexGrow: 1,
                      flexShrink: 1,
                      marginLeft: 10,
                      marginRight: 10,
                    }}
                  >
                    <Text>
                      <Text style={{ fontWeight: 'bold' }}>
                        {item.user?.name}{' '}
                      </Text>
                      in
                      <Text style={{ fontWeight: 'bold' }}>
                        {' '}
                        {item.channel?.name}
                      </Text>
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={{ flexWrap: 'nowrap', fontSize: 12 }}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                    }}
                  >
                    {dayjs(item.created_at).calendar(null, {
                      lastDay: 'DD/MM', // The day before ( Yesterday at 2:30 AM )
                      lastWeek: 'DD/MM', // Last week ( Last Monday at 2:30 AM )
                      sameDay: 'h:mm A', // The same day ( Today at 2:30 AM )
                      sameElse: 'DD/MM/YYYY', // Everything else ( 17/10/2011 )
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
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
