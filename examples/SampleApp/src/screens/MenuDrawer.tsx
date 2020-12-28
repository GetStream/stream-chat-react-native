import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useContext } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { AppContext } from '../context/AppContext';
import { NewDirectMessageIcon } from '../icons/NewDirectMessageIcon';
import { NewGroupIcon } from '../icons/NewGroupIcon';
import { SignOut } from '../icons/SignOut';
import { AppTheme } from '../types';

export const MenuDrawer: React.FC<DrawerContentComponentProps> = ({
  navigation,
}) => {
  const { colors } = useTheme() as AppTheme;
  const { chatClient, logout } = useContext(AppContext);
  if (!chatClient) return null;

  const userImage = chatClient.user?.image;
  return (
    <SafeAreaView style={{ backgroundColor: colors.background }}>
      <View style={styles.container}>
        <View style={[styles.row]}>
          <Image
            source={{
              uri: userImage,
            }}
            style={{
              borderRadius: 20,
              height: 40,
              width: 40,
            }}
          />
          <Text
            style={[
              styles.userName,
              {
                color: colors.text,
              },
            ]}
          >
            {chatClient.user?.name}
          </Text>
        </View>
        <View style={styles.menuContainer}>
          <View>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewDirectMessagingScreen')}
              style={styles.menuItem}
            >
              <NewDirectMessageIcon height={24} width={24} />
              <Text
                style={[
                  styles.menuTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                New Direct Messages
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('NewGroupChannelAddMemberScreen')}
              style={styles.menuItem}
            >
              <NewGroupIcon height={24} width={24} />
              <Text
                style={[
                  styles.menuTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                New Group
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => {
              logout();
            }}
            style={styles.menuItem}
          >
            <SignOut height={24} width={24} />
            <Text
              style={[
                styles.menuTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

/* eslint-disable sort-keys */
const styles = StyleSheet.create({
  container: {
    padding: 8,
    flexGrow: 1,
    height: '100%',
  },
  menuContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  menuIcon: {
    height: 18,
    width: 18,
  },
  menuItem: {
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  menuTitle: {
    fontSize: 14.5,
    marginLeft: 10,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  userName: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: 'bold',
  },
});
