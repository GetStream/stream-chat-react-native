import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { UserResponse } from 'stream-chat';
import { useTheme } from 'stream-chat-react-native/v2';

import { LocalUserType } from '../../types';

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
  const {
    theme: {
      colors: { black, white_smoke },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      key={`${tag}-${index}`}
      onPress={onPress}
      style={[styles.tagContainer, { backgroundColor: white_smoke }]}
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
            color: black,
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
});
