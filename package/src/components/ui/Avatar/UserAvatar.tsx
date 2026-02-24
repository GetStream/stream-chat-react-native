import React, { useMemo } from 'react';

import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { UserResponse } from 'stream-chat';

import { Avatar, AvatarProps } from './Avatar';
import { fontSizes, iconSizes, indicatorSizes, numberOfInitials } from './constants';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { PeopleIcon } from '../../../icons/PeopleIcon';
import { getInitialsFromName, hashStringToNumber } from '../../../utils/utils';
import { OnlineIndicator } from '../Badge';

export type UserAvatarProps = {
  user: UserResponse;
  showOnlineIndicator?: boolean;
  size: AvatarProps['size'];
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const UserAvatar = (props: UserAvatarProps) => {
  const { user, size, showBorder = !!user.image, showOnlineIndicator, style } = props;
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  const hashedValue = hashStringToNumber(user?.id || '');
  const index = ((hashedValue % 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const avatarBackgroundColor = semantics[`avatarPaletteBg${index}`];
  const avatarTextColor = semantics[`avatarPaletteText${index}`];

  const placeholder = useMemo(() => {
    if (user?.name) {
      return (
        <Text style={[fontSizes[size], { color: avatarTextColor }]}>
          {getInitialsFromName(user.name, numberOfInitials[size])}
        </Text>
      );
    } else {
      return (
        <PeopleIcon height={iconSizes[size]} stroke={avatarTextColor} width={iconSizes[size]} />
      );
    }
  }, [user?.name, size, avatarTextColor]);

  return (
    <View testID='user-avatar'>
      <Avatar
        backgroundColor={avatarBackgroundColor}
        imageUrl={user?.image}
        placeholder={placeholder}
        showBorder={showBorder}
        size={size}
        style={style}
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
