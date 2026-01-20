import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { Close, useTheme, UserAvatar } from 'stream-chat-react-native';

import type { UserResponse } from 'stream-chat';

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
  user: UserResponse;
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
      <UserAvatar user={user} size='lg' showOnlineIndicator={user.online} showBorder />

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
