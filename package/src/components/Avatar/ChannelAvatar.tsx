import React, { useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import { Channel } from 'stream-chat';

import { iconSizes, indicatorSizes } from './constants';

import { GroupIcon } from '../../icons/GroupIcon';
import { NewAvatar } from '../ui/Avatar';

import { OnlineIndicator } from '../ui/OnlineIndicator';

export type NewChannelAvatarProps = {
  channel: Channel;
  showOnlineIndicator?: boolean;
  size: 'xs' | 'sm' | 'md' | 'lg';
  showBorder?: boolean;
};

export const NewChannelAvatar = (props: NewChannelAvatarProps) => {
  const { channel, size, showBorder = false, showOnlineIndicator = false } = props;

  const placeholder = useMemo(() => {
    return <GroupIcon height={iconSizes[size]} stroke={'#003179'} width={iconSizes[size]} />;
  }, [size]);

  return (
    <View>
      <NewAvatar
        imageUrl={channel.data?.image}
        placeholder={placeholder}
        showBorder={showBorder}
        size={size}
      />
      {showOnlineIndicator ? (
        <View style={styles.onlineIndicatorWrapper}>
          <OnlineIndicator online={false} size={indicatorSizes[size]} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  onlineIndicatorWrapper: {
    position: 'absolute',
    right: -2,
    top: -2,
  },
});
