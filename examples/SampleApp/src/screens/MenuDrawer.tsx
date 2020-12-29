import React, { useContext } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Edit, Group, User, useTheme } from 'stream-chat-react-native/v2';

import { AppContext } from '../context/AppContext';

export const MenuDrawer: React.FC<DrawerContentComponentProps> = ({
  navigation,
}) => {
  const {
    theme: {
      colors: { black, grey, white_snow },
    },
  } = useTheme();
  const { chatClient, logout } = useContext(AppContext);
  if (!chatClient) return null;

  const userImage = chatClient.user?.image;
  return (
    <SafeAreaView style={{ backgroundColor: white_snow }}>
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
                color: black,
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
              <Edit height={24} pathFill={grey} width={24} />
              <Text
                style={[
                  styles.menuTitle,
                  {
                    color: black,
                  },
                ]}
              >
                New Direct Messages
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('NewGroupChannelAddMemberScreen')
              }
              style={styles.menuItem}
            >
              <Group height={24} pathFill={grey} width={24} />
              <Text
                style={[
                  styles.menuTitle,
                  {
                    color: black,
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
            <User height={24} pathFill={grey} width={24} />
            <Text
              style={[
                styles.menuTitle,
                {
                  color: black,
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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    height: '100%',
    padding: 8,
  },
  menuContainer: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'space-between',
    marginTop: 20,
  },
  menuIcon: {
    height: 18,
    width: 18,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
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
    fontWeight: 'bold',
    marginLeft: 16,
  },
});
