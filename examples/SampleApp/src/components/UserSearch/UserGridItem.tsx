import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserResponse } from 'stream-chat';
import { Avatar, useTheme } from 'stream-chat-react-native/v2';

import { Close } from '../../icons/Close';
import { LocalUserType } from '../../types';

export type UserGridItemProps = {
  onPress: () => void;
  user: UserResponse<LocalUserType>;
  removeButton?: boolean;
};
export const UserGridItem: React.FC<UserGridItemProps> = ({
  onPress,
  removeButton = true,
  user,
}) => {
  const {
    theme: {
      colors: { white_snow },
    },
  } = useTheme();
  return (
    <View style={styles.selectedUserItemContainer}>
      <TouchableOpacity
        key={user.id}
        onPress={onPress}
        style={styles.selectedUserItem}
      >
        <Avatar image={user.image} size={64} />
        {removeButton && (
          <View
            style={[
              styles.selectedUserRemoveIcon,
              {
                backgroundColor: white_snow,
              },
            ]}
          >
            <Close height={24} width={24} />
          </View>
        )}
      </TouchableOpacity>
      <Text numberOfLines={2} style={styles.selectedUserItemName}>
        {user.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  selectedUserItem: {
    margin: 8,
  },
  selectedUserItemContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    padding: 8,
    width: 80,
  },
  selectedUserItemName: {
    flexWrap: 'wrap',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedUserRemoveIcon: {
    alignItems: 'center',
    borderRadius: 15,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -2,
    width: 24,
  },
  selectedUsersContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
