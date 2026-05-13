import React, { useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Pressable } from 'react-native';

import { UserResponse } from 'stream-chat';

import { USERS } from '../constants/ChatUsers';
import { useUserContext } from '../context/UserContext';

const PredefinedUserItem = ({ item }: { item: UserResponse }) => {
  const { logIn } = useUserContext();
  const handleUserSelect = useCallback(() => {
    logIn(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- example app: `item` is a stable prop, identity tied to logIn
  }, [logIn]);

  return (
    <Pressable style={styles.row} onPress={handleUserSelect}>
      <Image source={{ uri: item.image }} style={styles.avatar} />
      <Text style={styles.name}>{item.name}</Text>
    </Pressable>
  );
};

const renderItem = ({ item }: { item: UserResponse }) => <PredefinedUserItem item={item} />;

const keyExtractor = (item: UserResponse) => item.id;

const Separator = () => <View style={styles.separator} />;

const UserLogin = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a user to log in</Text>
      <FlatList
        data={Object.values(USERS)}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={Separator}
        renderItem={renderItem}
      />
    </View>
  );
};

export default UserLogin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    alignSelf: 'center',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 56,
  },
});
