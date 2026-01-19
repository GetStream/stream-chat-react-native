import React, { useMemo } from 'react';

import { StyleSheet, Text } from 'react-native';

import { Reaction } from '../../types/types';
import { getInitialsFromName } from '../../utils/utils';
import { Avatar, AvatarProps } from '../ui';

export type MessageUserReactionsAvatarProps = {
  /**
   * The reaction object
   */
  reaction: Reaction;
} & Pick<AvatarProps, 'size'>;

export const MessageUserReactionsAvatar = (props: MessageUserReactionsAvatarProps) => {
  const {
    reaction: { image, name },
    size,
  } = props;

  const placeholder = useMemo(() => {
    return <Text style={styles.text}>{getInitialsFromName(name)}</Text>;
  }, [name]);

  return <Avatar imageUrl={image} placeholder={placeholder} size={size} />;
};

const styles = StyleSheet.create({
  text: {
    color: '#003179',
  },
});
