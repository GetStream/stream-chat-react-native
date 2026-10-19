import React from 'react';

import { useCallback, useContext } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { Stack, useRouter } from 'expo-router';
import { ChannelList, SqliteClient } from 'stream-chat-expo';

import { AppContext } from '../context/AppContext';

import { useUserContext } from '@/context/UserContext';
import { getInitialsOfName } from '@/utils/getInitialsOfName';

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

const renderLogoutButton = () => <LogoutButton />;

export default function ChannelListScreen() {
  const router = useRouter();
  const { channelListPaginator, setChannel } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Channel List Screen', headerLeft: renderLogoutButton }} />

      {channelListPaginator ? (
        <ChannelList
          onSelect={(channel) => {
            setChannel(channel);
            router.push(`/channel/${channel.cid}`);
          }}
          paginator={channelListPaginator}
        />
      ) : null}
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
