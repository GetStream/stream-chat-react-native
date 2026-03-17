import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { UserResponse } from 'stream-chat';

import { Avatar, AvatarProps } from './Avatar';

import { iconSizes } from './constants';

import { UserAvatar, UserAvatarProps } from './UserAvatar';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { PeopleIcon } from '../../../icons/PeopleIcon';
import { primitives } from '../../../theme';
import { BadgeCount, BadgeCountProps, OnlineIndicator, OnlineIndicatorProps } from '../Badge';

export type AvatarGroupProps = {
  /**
   * The size of the avatar group.
   */
  size: 'lg' | 'xl' | '2xl';
  /**
   * The items to display in the avatar group.
   */
  items: React.ReactNode[];
};

// Sizes accounts for the border width as well
const sizes = {
  '2xl': {
    width: 64,
    height: 64,
  },
  xl: {
    width: 48,
    height: 48,
  },
  lg: {
    width: 44,
    height: 44,
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

const avatarSize: Record<AvatarGroupProps['size'], AvatarProps['size']> = {
  '2xl': 'lg',
  xl: 'md',
  lg: 'sm',
};

const badgeCountSize: Record<AvatarGroupProps['size'], BadgeCountProps['size']> = {
  '2xl': 'lg',
  xl: 'md',
  lg: 'sm',
};

export const AvatarGroup = (props: AvatarGroupProps) => {
  const { size, items = [] } = props;
  const {
    theme: { semantics },
  } = useTheme();
  const avatarGroupStyles = useUserAvatarGroupStyles();

  const buildForOne = useCallback(
    (item: React.ReactNode) => {
      return buildForTwo([
        item,
        <Avatar
          style={avatarGroupStyles.userAvatarWrapper}
          key={'people-icon'}
          backgroundColor={semantics.avatarBgPlaceholder}
          showBorder={true}
          placeholder={
            <PeopleIcon
              stroke={semantics.avatarTextPlaceholder}
              height={iconSizes[avatarSize[size]]}
              width={iconSizes[avatarSize[size]]}
            />
          }
          size={avatarSize[size]}
        />,
      ]);
    },
    [avatarGroupStyles.userAvatarWrapper, semantics, size],
  );

  const buildForMore = useCallback(
    (items: React.ReactNode[]) => {
      const remainingItems = items.length - 2;
      return (
        <>
          <View style={styles.topStart}>{items[0]}</View>
          <View style={styles.topEnd}>{items[1]}</View>
          <View style={styles.bottomCenter}>
            <BadgeCount size={badgeCountSize[size]} count={`+${remainingItems}`} />
          </View>
        </>
      );
    },
    [size],
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

const userAvatarSize: Record<UserAvatarGroupProps['size'], UserAvatarProps['size']> = {
  '2xl': 'lg',
  xl: 'md',
  lg: 'sm',
};

const onlineIndicatorSize: Record<UserAvatarGroupProps['size'], OnlineIndicatorProps['size']> = {
  '2xl': 'xl',
  xl: 'xl',
  lg: 'lg',
};

export const UserAvatarGroup = ({
  users,
  showOnlineIndicator = true,
  size,
}: UserAvatarGroupProps) => {
  const styles = useUserAvatarGroupStyles();

  return (
    <View testID='user-avatar-group'>
      <AvatarGroup
        size={size}
        items={users.map((user) => (
          <UserAvatar
            key={user.id}
            style={styles.userAvatarWrapper}
            user={user}
            size={userAvatarSize[size]}
            showBorder={true}
          />
        ))}
      />
      {showOnlineIndicator ? (
        <View style={styles.onlineIndicatorWrapper}>
          <OnlineIndicator online={true} size={onlineIndicatorSize[size]} />
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
          borderColor: semantics.borderCoreInverse,
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
  container: {},
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
