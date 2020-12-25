import React, { useContext, useState } from 'react';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  generateRandomId,
  ThemeProvider,
  useTheme,
} from 'stream-chat-react-native/v2';

import { RoundButton } from '../components/RoundButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { Check } from '../icons/Check';
import { StackNavigatorParamList } from '../types';

type NewGroupChannelAssignNameScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'NewGroupChannelAssignNameScreen'
>;
type NewGroupChannelAssignNameScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'NewGroupChannelAssignNameScreen'
>;

export type NewGroupChannelAssignNameScreenProps = {
  navigation: NewGroupChannelAssignNameScreenNavigationProp;
  route: NewGroupChannelAssignNameScreenRouteProp;
};

export const NewGroupChannelAssignNameScreen: React.FC<NewGroupChannelAssignNameScreenProps> = ({
  navigation,
  route: {
    params: { selectedUsers },
  },
}) => {
  const {
    theme: {
      colors: { accent_blue, black, border, grey, white, white_snow },
    },
  } = useTheme();
  const { chatClient } = useContext(AppContext);
  const [groupName, setGroupName] = useState('');
  if (!chatClient) return null;

  return (
    <ThemeProvider>
      <ScreenHeader
        RightContent={() => (
          <View style={{ marginRight: 15 }}>
            <RoundButton
              disabled={!groupName}
              onPress={() => {
                if (!chatClient.user || !selectedUsers || !groupName) return;

                const channel = chatClient.channel(
                  'messaging',
                  generateRandomId(),
                  {
                    name: groupName,
                    members: [
                      ...selectedUsers.map((u) => u.id),
                      chatClient.user?.id,
                    ],
                  },
                );

                // TODO: Maybe there is a better way to do this.
                navigation.pop();
                navigation.replace('ChannelScreen', {
                  channelId: channel.id,
                });
              }}
            >
              <Check
                fill={groupName ? accent_blue : undefined}
                height={24}
                width={24}
              />
            </RoundButton>
          </View>
        )}
        titleText='Name of Group Chat'
      />
      <View>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <View
            style={[
              styles.searchContainer,
              {
                borderBottomColor: border,
              },
            ]}
          >
            <View
              style={{
                flexGrow: 1,
                flexShrink: 1,
              }}
            >
              <View
                style={[
                  styles.inputBoxContainer,
                  {
                    backgroundColor: white,
                    borderColor: border,
                  },
                ]}
              >
                <Text>Name</Text>
                <TextInput
                  autoFocus
                  onChangeText={(text) => {
                    setGroupName(text);
                  }}
                  placeholder='Choose a group chat name'
                  placeholderTextColor={grey}
                  style={[
                    styles.inputBox,
                    {
                      color: black,
                    },
                  ]}
                  value={groupName}
                />
              </View>
            </View>
          </View>
          <View
            style={{
              backgroundColor: white_snow,
              padding: 5,
              paddingLeft: 8,
            }}
          >
            <Text
              style={{
                color: black,
              }}
            >
              {selectedUsers.length} Members
            </Text>
          </View>
          {selectedUsers && selectedUsers.length >= 0 && (
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <UserSearchResults
                groupedAlphabetically={false}
                results={selectedUsers}
                selectedUserIds={selectedUsers.map((u) => u.id)}
                showOnlineStatus={false}
                toggleSelectedUser={() => null}
              />
            </View>
          )}
        </View>
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 15,
  },
  emptyResultIndicator: {
    alignItems: 'center',
    height: 300,
    justifyContent: 'center',
  },
  emptyResultIndicatorEmoji: {
    fontSize: 60,
  },
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
  },
  inputBox: {
    flex: 1,
    marginLeft: 10,
    padding: 0,
  },
  inputBoxContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: 4,
    padding: 10,
    paddingBottom: 20,
    paddingTop: 20,
    width: '100%',
  },
  searchContainer: {
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
  },
  searchContainerLabel: {
    fontSize: 15,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 4,
  },
  searchResultContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
  searchResultUserDetails: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 8,
  },
  searchResultUserImage: {
    borderRadius: 20,
    height: 30,
    width: 30,
  },
  searchResultUserLastOnline: { fontSize: 12.5 },
  searchResultUserName: { fontSize: 14 },
});
