import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar, Close, useTheme } from 'stream-chat-react-native';

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
  selectedUserItemContainer: {
    alignItems: 'center',
  },
  selectedUserItemName: {
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 8,
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
    <TouchableOpacity key={user.id} onPress={onPress} style={styles.selectedUserItemContainer}>
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
      <Text numberOfLines={2} style={[styles.selectedUserItemName, { color: black }]}>
        {user.name}
      </Text>
    </TouchableOpacity>
  );
};
