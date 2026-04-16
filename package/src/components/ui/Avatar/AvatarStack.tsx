import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { UserResponse } from 'stream-chat';

import { avatarSizes } from './constants';

import { UserAvatar } from './UserAvatar';

import { BadgeCount } from '../Badge';

export type AvatarStackProps = {
  avatarSize?: 'md' | 'sm' | 'xs';
  maxVisible?: number;
  items: React.ReactNode[];
  overlap?: number;
};

export const AvatarStack = (props: AvatarStackProps) => {
  const { avatarSize = 'sm', maxVisible = 3, items = [], overlap = 0 } = props;
  const styles = useStyles();
  const diameter = avatarSizes[avatarSize].width;
  const visiblePortion = diameter * (1 - overlap);
  const visibleItems = items.slice(0, maxVisible);
  const extraCount = items.length - visibleItems.length;

  const totalWidth = diameter + (visibleItems.length - 1) * visiblePortion;

  const badgeCountSize = avatarSize === 'md' ? 'lg' : avatarSize === 'sm' ? 'md' : 'sm';

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            width: totalWidth,
            height: diameter,
          },
        ]}
      >
        {visibleItems.map((item, index) => {
          return (
            <View
              style={[
                styles.item,
                {
                  left: index * visiblePortion,
                },
              ]}
              key={index}
            >
              {item}
            </View>
          );
        })}
      </View>

      {extraCount > 0 && (
        <View
          style={[
            styles.badgeCount,
            {
              marginLeft: -(overlap * diameter),
            },
          ]}
        >
          <BadgeCount count={extraCount} size={badgeCountSize} />
        </View>
      )}
    </View>
  );
};

export type UserAvatarStackProps = Pick<
  AvatarStackProps,
  'avatarSize' | 'maxVisible' | 'overlap'
> & {
  users: UserResponse[];
};

export const UserAvatarStack = ({
  avatarSize = 'sm',
  maxVisible,
  overlap,
  users,
}: UserAvatarStackProps) => {
  const items = useMemo(
    () =>
      users.map((user) => {
        return <UserAvatar key={user.id} user={user} size={avatarSize} showBorder />;
      }),
    [avatarSize, users],
  );

  return (
    <AvatarStack avatarSize={avatarSize} maxVisible={maxVisible} overlap={overlap} items={items} />
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        item: {
          position: 'absolute',
        },
        badgeCount: {},
        wrapper: {
          flexDirection: 'row',
        },
      }),
    [],
  );
};
