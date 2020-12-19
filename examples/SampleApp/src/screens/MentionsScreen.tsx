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
  const {
    loading,
    loadMore,
    messages,
    refreshing,
    refreshList,
  } = usePaginatedMentionedMessages();
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
            onEndReached={loadMore}
            onRefresh={refreshList}
            refreshing={refreshing}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ChannelScreen', {
                    channelId: item.channel?.id,
                    messageId: item.id,
                  });
                }}
                style={{
                  borderBottomColor: colors.borderLight,
                  borderBottomWidth: 1,
                  flexDirection: 'row',
                  padding: 12,
                }}
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
                      marginRight: 20,
                    }}
                  >
                    <Text style={{ color: colors.text }}>
                      <Text style={{ fontWeight: '700' }}>
                        {item.user?.name}{' '}
                      </Text>
                      in
                      <Text style={{ fontWeight: '700' }}>
                        {' '}
                        {item.channel?.name}
                      </Text>
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.textLight,
                        flexWrap: 'nowrap',
                        fontSize: 12,
                        fontWeight: '400'
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text
                    style={{
                      color: colors.textLight,
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
