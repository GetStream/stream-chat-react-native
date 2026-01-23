import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { UserResponse } from 'stream-chat';

import { Avatar } from './Avatar';
import { fontSizes, iconSizes, indicatorSizes, numberOfInitials } from './constants';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { PeopleIcon } from '../../../icons/PeopleIcon';
import { getInitialsFromName, hashStringToNumber } from '../../../utils/utils';
import { OnlineIndicator } from '../OnlineIndicator';

export type UserAvatarProps = {
  user: UserResponse;
  showOnlineIndicator?: boolean;
  size: 'xs' | 'sm' | 'md' | 'lg';
  showBorder?: boolean;
};

export const UserAvatar = (props: UserAvatarProps) => {
  const { user, size, showBorder = !!user.image, showOnlineIndicator } = props;
  const {
    theme: {
      colors: { avatarPalette },
    },
  } = useTheme();
  const styles = useStyles();
  const hashedValue = hashStringToNumber(user.id);
  const index = hashedValue % (avatarPalette?.length ?? 1);
  const avatarColors = avatarPalette?.[index];

  const placeholder = useMemo(() => {
    if (user.name) {
      return (
        <Text style={[fontSizes[size], { color: avatarColors?.text }]}>
          {getInitialsFromName(user.name, numberOfInitials[size])}
        </Text>
      );
    } else {
      return (
        <PeopleIcon height={iconSizes[size]} stroke={avatarColors?.text} width={iconSizes[size]} />
      );
    }
  }, [user.name, size, avatarColors]);

  return (
    <View testID='user-avatar'>
      <Avatar
        backgroundColor={avatarColors?.bg}
        imageUrl={user.image}
        placeholder={placeholder}
        showBorder={showBorder}
        size={size}
      />
      {showOnlineIndicator ? (
        <View style={styles.onlineIndicatorWrapper}>
          <OnlineIndicator online={true} size={indicatorSizes[size]} />
        </View>
      ) : null}
    </View>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        onlineIndicatorWrapper: {
          position: 'absolute',
          right: -2,
          top: -2,
        },
      }),
    [],
  );
};
