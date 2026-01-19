import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { UserResponse } from 'stream-chat';

import { Avatar } from './Avatar';
import { fontSizes, iconSizes, indicatorSizes, numberOfInitials } from './constants';

import { PeopleIcon } from '../../../icons/PeopleIcon';
import { getInitialsFromName } from '../../../utils/utils';
import { OnlineIndicator } from '../OnlineIndicator';

export type UserAvatarProps = {
  user?: UserResponse;
  showOnlineIndicator?: boolean;
  size: 'xs' | 'sm' | 'md' | 'lg';
  showBorder?: boolean;
};

export const UserAvatar = (props: UserAvatarProps) => {
  const { user, size, showBorder = false, showOnlineIndicator } = props;

  const placeholder = useMemo(() => {
    if (user?.name) {
      return (
        <Text style={[styles.text, fontSizes[size]]}>
          {getInitialsFromName(user.name, numberOfInitials[size])}
        </Text>
      );
    } else {
      return <PeopleIcon height={iconSizes[size]} stroke={'#003179'} width={iconSizes[size]} />;
    }
  }, [user?.name, size]);

  if (!user) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <Avatar imageUrl={user.image} placeholder={placeholder} showBorder={showBorder} size={size} />
      {showOnlineIndicator ? (
        <View style={styles.onlineIndicatorWrapper}>
          <OnlineIndicator online={true} size={indicatorSizes[size]} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#003179',
  },
  onlineIndicatorWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  wrapper: {
    padding: 2,
  },
});
