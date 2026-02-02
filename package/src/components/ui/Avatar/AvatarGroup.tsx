import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { UserResponse } from 'stream-chat';

import { Avatar } from './Avatar';

import { iconSizes } from './constants';

import { UserAvatar } from './UserAvatar';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { PeopleIcon } from '../../../icons/PeopleIcon';
import { primitives } from '../../../theme';
import { BadgeCount } from '../BadgeCount';
import { OnlineIndicator } from '../OnlineIndicator';

export type AvatarGroupProps = {
  /**
   * The size of the avatar group.
   */
  size: 'lg' | 'xl';
  /**
   * The items to display in the avatar group.
   */
  items: React.ReactNode[];
};

const sizes = {
  lg: {
    width: 40,
    height: 40,
  },
  xl: {
    width: 64,
    height: 64,
  },
};

const buildForTwo = (items: React.ReactNode[]) => {
  return (
    <>
      <View style={styles.topStart}>{items[0]}</View>
      <View style={styles.bottomEnd}>{items[1]}</View>
    </>
  );
};

const buildForThree = (items: React.ReactNode[]) => {
  return (
    <>
      <View style={styles.topCenter}>{items[0]}</View>
      <View style={styles.bottomStart}>{items[1]}</View>
      <View style={styles.bottomEnd}>{items[2]}</View>
    </>
  );
};

const buildForFour = (items: React.ReactNode[]) => {
  return (
    <>
      <View style={styles.topStart}>{items[0]}</View>
      <View style={styles.topEnd}>{items[1]}</View>
      <View style={styles.bottomStart}>{items[2]}</View>
      <View style={styles.bottomEnd}>{items[3]}</View>
    </>
  );
};

export const AvatarGroup = (props: AvatarGroupProps) => {
  const { size, items = [] } = props;
  const {
    theme: { semantics },
  } = useTheme();

  const avatarSize = size === 'lg' ? 'sm' : 'lg';
  const badgeCountSize = size === 'lg' ? 'xs' : 'md';

  const buildForOne = useCallback(
    (item: React.ReactNode) => {
      return buildForTwo([
        <Avatar
          key={'people-icon'}
          placeholder={
            <PeopleIcon
              stroke={semantics.avatarTextDefault}
              height={iconSizes[avatarSize]}
              width={iconSizes[avatarSize]}
            />
          }
          size={avatarSize}
        />,
        item,
      ]);
    },
    [semantics.avatarTextDefault, avatarSize],
  );

  const buildForMore = useCallback(
    (items: React.ReactNode[]) => {
      const remainingItems = items.length - 2;
      return (
        <>
          <View style={styles.topStart}>{items[0]}</View>
          <View style={styles.topEnd}>{items[1]}</View>
          <View style={styles.bottomCenter}>
            <BadgeCount size={badgeCountSize} count={`+${remainingItems}`} />
          </View>
        </>
      );
    },
    [badgeCountSize],
  );

  const renderItems = useMemo(() => {
    const length = items.length;
    if (length === 1) {
      return buildForOne(items[0]);
    }
    if (length === 2) {
      return buildForTwo(items);
    }
    if (length === 3) {
      return buildForThree(items);
    }
    if (length === 4) {
      return buildForFour(items);
    }
    return buildForMore(items);
  }, [buildForMore, buildForOne, items]);

  return (
    <View style={styles.container}>
      <View style={[sizes[size]]}>{renderItems}</View>
    </View>
  );
};

export type UserAvatarGroupProps = Pick<AvatarGroupProps, 'size'> & {
  /**
   * The users to display in the avatar group.
   */
  users: UserResponse[];
  /**
   * Whether to show the online indicator.
   */
  showOnlineIndicator?: boolean;
};

export const UserAvatarGroup = ({
  users,
  showOnlineIndicator = true,
  size,
}: UserAvatarGroupProps) => {
  const styles = useUserAvatarGroupStyles();
  const userAvatarSize = size === 'lg' ? 'sm' : 'lg';
  const onlineIndicatorSize = size === 'xl' ? 'xl' : 'lg';
  return (
    <View testID='user-avatar-group'>
      <AvatarGroup
        size={size}
        items={users.map((user) => (
          <View key={user.id} style={styles.userAvatarWrapper}>
            <UserAvatar user={user} size={userAvatarSize} showBorder={true} />
          </View>
        ))}
      />
      {showOnlineIndicator ? (
        <View style={styles.onlineIndicatorWrapper}>
          <OnlineIndicator online={true} size={onlineIndicatorSize} />
        </View>
      ) : null}
    </View>
  );
};

const useUserAvatarGroupStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        userAvatarWrapper: {
          borderWidth: 2,
          borderColor: semantics.borderCoreOnAccent,
          borderRadius: primitives.radiusMax,
        },
        onlineIndicatorWrapper: {
          position: 'absolute',
          right: 0,
          top: 0,
        },
      }),
    [semantics],
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 2,
  },
  topStart: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bottomEnd: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  topEnd: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  bottomStart: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  topCenter: {
    alignItems: 'center',
  },
  bottomCenter: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
});
