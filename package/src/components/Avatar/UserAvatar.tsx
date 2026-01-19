import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { UserResponse } from 'stream-chat';

import { fontSizes, iconSizes, indicatorSizes, numberOfInitials } from './constants';

import { PeopleIcon } from '../../icons/PeopleIcon';
import { NewAvatar } from '../ui/Avatar';

import { OnlineIndicator } from '../ui/OnlineIndicator';

const getInitials = (name: string, numberOfInitials: number = 2) => {
  return name
    .split(' ')
    .slice(0, numberOfInitials)
    .map((n) => n.charAt(0))
    .join('');
};

export type NewUserAvatarProps = {
  user?: UserResponse;
  showOnlineIndicator?: boolean;
  size: 'xs' | 'sm' | 'md' | 'lg';
  showBorder?: boolean;
};

export const NewUserAvatar = (props: NewUserAvatarProps) => {
  const { user, size, showBorder = false, showOnlineIndicator } = props;

  const placeholder = useMemo(() => {
    if (user?.name) {
      return (
        <Text style={[styles.text, fontSizes[size]]}>
          {getInitials(user.name, numberOfInitials[size])}
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
      <NewAvatar
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
