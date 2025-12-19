import React from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { ChannelList, SqliteClient } from 'stream-chat-expo';
import { useCallback, useContext, useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ChannelSort } from 'stream-chat';
import { AppContext } from '../context/AppContext';
import { useUserContext } from '@/context/UserContext';
import { getInitialsOfName } from '@/utils/getInitialsOfName';

const sort: ChannelSort = { last_updated: -1 };
const options = {
  state: true,
  watch: true,
};

const LogoutButton = () => {
  const { logOut, user } = useUserContext();

  const onLogoutHandler = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          SqliteClient.resetDB();
          logOut();
        },
      },
    ]);
  }, [logOut]);

  return (
    <Pressable onPress={onLogoutHandler}>
      <Image
        source={{
          uri:
            user?.image ||
            `https://getstream.imgix.net/images/random_svg/${getInitialsOfName(user?.name || '')}.png`,
        }}
        style={styles.avatar}
      />
    </Pressable>
  );
};

export default function ChannelListScreen() {
  const { user } = useUserContext();
  const filters = useMemo(
    () => ({
      members: { $in: [user?.id as string] },
      type: 'messaging',
    }),
    [user?.id],
  );
  const router = useRouter();
  const { setChannel } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ title: 'Channel List Screen', headerLeft: () => <LogoutButton /> }}
      />

      <ChannelList
        filters={filters}
        onSelect={(channel) => {
          setChannel(channel);
          router.push(`/channel/${channel.cid}`);
        }}
        options={options}
        sort={sort}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
});
