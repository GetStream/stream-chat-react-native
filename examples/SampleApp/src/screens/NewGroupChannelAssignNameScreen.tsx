import React, { useContext, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { generateRandomId, useTheme } from 'stream-chat-react-native/v2';

import { RoundButton } from '../components/RoundButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { Check } from '../icons/Check';

import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 0,
  },
  inputBox: {
    flex: 1,
    marginLeft: 16,
    padding: 0,
  },
  inputBoxContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  membersContainer: {
    paddingLeft: 8,
    paddingVertical: 5,
  },
  nameText: {
    fontSize: 12,
    fontWeight: '200',
    textAlignVertical: 'center',
  },
});

type ConfirmButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};

const ConfirmButton: React.FC<ConfirmButtonProps> = (props) => {
  const { disabled, onPress } = props;
  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

  return (
    <RoundButton disabled={disabled} onPress={onPress}>
      <Check
        fill={!disabled ? accent_blue : undefined}
        height={24}
        width={24}
      />
    </RoundButton>
  );
};

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
      colors: { black, border, grey, white, white_snow },
    },
  } = useTheme();
  const { chatClient } = useContext(AppContext);
  const [groupName, setGroupName] = useState('');

  if (!chatClient) return null;

  const onConfirm = () => {
    if (!chatClient.user || !selectedUsers || !groupName) return;

    const channel = chatClient.channel('messaging', generateRandomId(), {
      members: [...selectedUsers.map((u) => u.id), chatClient.user?.id],
      name: groupName,
    });

    // TODO: Maybe there is a better way to do this.
    navigation.pop();
    navigation.replace('ChannelScreen', {
      channelId: channel.id,
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        RightContent={() => (
          <ConfirmButton disabled={!groupName} onPress={onConfirm} />
        )}
        style={styles.header}
        titleText='Name of Group Chat'
      />
      <View style={styles.container}>
        <View
          style={[
            styles.inputBoxContainer,
            {
              backgroundColor: white,
              borderColor: border,
            },
          ]}
        >
          <Text style={[styles.nameText, { color: grey }]}>NAME</Text>
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
        <View
          style={[styles.membersContainer, { backgroundColor: white_snow }]}
        >
          <Text
            style={{
              color: black,
            }}
          >
            {selectedUsers.length} Members
          </Text>
        </View>
        {selectedUsers.length >= 0 && (
          <UserSearchResults
            groupedAlphabetically={false}
            results={selectedUsers}
            selectedUserIds={selectedUsers.map((u) => u.id)}
            showOnlineStatus={false}
            toggleSelectedUser={() => null}
          />
        )}
      </View>
    </View>
  );
};
