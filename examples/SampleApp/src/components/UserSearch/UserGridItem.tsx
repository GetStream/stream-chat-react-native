import { useTheme } from '@react-navigation/native';
import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserResponse } from 'stream-chat';
import { Avatar } from 'stream-chat-react-native/v2';
import { AppContext } from '../../context/AppContext';
import { Close } from '../../icons/Close';
import { AppTheme, LocalUserType } from '../../types';

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
  const { colors } = useTheme() as AppTheme;
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
                backgroundColor: colors.background,
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
  selectedUsersContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedUserItemContainer: {
    flexDirection: 'column',
    width: 80,
    alignItems: 'center',
    padding: 8,
  },
  selectedUserItem: {
    margin: 8,
  },
  selectedUserItemName: {
    fontWeight: '600',
    fontSize: 12,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  selectedUserRemoveIcon: {
    borderRadius: 15,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    right: -2,
    top: -2,
    height: 24,
    width: 24,
  },
});
