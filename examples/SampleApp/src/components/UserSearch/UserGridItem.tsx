import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar, Close, useTheme } from 'stream-chat-react-native/v2';

import type { UserResponse } from 'stream-chat';

import type { LocalUserType } from '../../types';

const presenceIndicator = { cx: 7, cy: 7, r: 5 };

const styles = StyleSheet.create({
  presenceIndicatorContainer: {
    bottom: 0,
    height: 14,
    right: 8,
    top: undefined,
    width: 14,
  },
  selectedUserItem: {
    paddingBottom: 8,
  },
  selectedUserItemContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    padding: 8,
    width: 80,
  },
  selectedUserItemName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedUserRemoveIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 24,
  },
  selectedUsersContainer: {
    flexDirection: 'row',
  },
});

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
      colors: { black, white_snow },
    },
  } = useTheme();
  return (
    <View style={styles.selectedUserItemContainer}>
      <TouchableOpacity
        key={user.id}
        onPress={onPress}
        style={styles.selectedUserItem}
      >
        <Avatar
          image={user.image}
          online={user.online}
          presenceIndicator={presenceIndicator}
          presenceIndicatorContainerStyle={styles.presenceIndicatorContainer}
          size={64}
        />
        {removeButton && (
          <View
            style={[
              styles.selectedUserRemoveIcon,
              {
                backgroundColor: white_snow,
              },
            ]}
          >
            <Close />
          </View>
        )}
      </TouchableOpacity>
      <Text
        numberOfLines={2}
        style={[styles.selectedUserItemName, { color: black }]}
      >
        {user.name}
      </Text>
    </View>
  );
};
