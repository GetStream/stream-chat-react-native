import React from 'react';
import { useUserContext } from '@/context/UserContext';
import { useCallback } from 'react';
import { Alert, Image, Pressable, StyleSheet } from 'react-native';
import { SqliteClient } from 'stream-chat-expo';
import { getInitialsOfName } from '@/utils/getInitialsOfName';

export const LogoutButton = () => {
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
    <Pressable onPress={onLogoutHandler} style={styles.container}>
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

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  container: {},
});
