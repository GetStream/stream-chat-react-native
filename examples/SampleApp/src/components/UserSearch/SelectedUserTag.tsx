import React, { Ref, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { AppTheme, LocalUserType } from '../../types';
import { UserResponse } from 'stream-chat';
import { Text } from 'react-native';

type SelectedUserTagProps = {
  index: number;
  onPress: () => void;
  tag: UserResponse<LocalUserType>;
  disabled?: boolean;
};

export const SelectedUserTag: React.FC<SelectedUserTagProps> = ({
  disabled = false,
  index,
  onPress,
  tag,
}) => {
  const { colors } = useTheme() as AppTheme;

  return (
    <TouchableOpacity
      disabled={disabled}
      key={`${tag}-${index}`}
      onPress={onPress}
      style={[
        styles.tagContainer,
        { backgroundColor: colors.greyContentBackground },
      ]}
    >
      <Image
        source={{
          uri: tag.image,
        }}
        style={styles.tagImage}
      />

      <Text
        style={[
          styles.tagText,
          {
            color: colors.text,
          },
        ]}
      >
        {tag.name}
      </Text>
    </TouchableOpacity>
  );
};

/* eslint-disable sort-keys */
const styles = StyleSheet.create({
  tagContainer: {
    flexDirection: 'row',
    margin: 4,
    borderRadius: 20,
  },
  tagImage: {
    height: 25,
    width: 25,
    borderRadius: 20,
  },
  tagText: {
    paddingLeft: 7,
    paddingRight: 12,
    fontSize: 14,
    alignSelf: 'center',
  },
  blurredTagText: { color: '#0080ff' },
});
