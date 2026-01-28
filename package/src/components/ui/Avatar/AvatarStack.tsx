import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { UserResponse } from 'stream-chat';

import { avatarSizes } from './constants';

import { UserAvatar } from './UserAvatar';

import { BadgeCount } from '../BadgeCount';

export type AvatarStackProps = {
  avatarSize?: 'sm' | 'xs';
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

  if (extraCount > 0) {
    visibleItems.push(<BadgeCount count={extraCount} size={avatarSize} />);
  }

  const totalWidth = diameter + (visibleItems.length - 1) * visiblePortion;

  return (
    <View
      style={[
        styles.container,
        {
          width: totalWidth,
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
  );
};

export type UserAvatarStackProps = Pick<
  AvatarStackProps,
  'avatarSize' | 'maxVisible' | 'overlap'
> & {
  users: UserResponse[];
};

export const UserAvatarStack = ({
  avatarSize,
  maxVisible,
  overlap,
  users,
}: UserAvatarStackProps) => {
  const items = users.map((user) => {
    return <UserAvatar key={user.id} user={user} size='sm' showBorder />;
  });

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
      }),
    [],
  );
};
