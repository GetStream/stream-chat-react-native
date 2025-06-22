import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';



const styles = StyleSheet.create({
  tagContainer: {
    borderRadius: 12,
    flexDirection: 'row',
    marginRight: 8,
    marginVertical: 8,
  },
  tagImage: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  tagText: {
    alignSelf: 'center',
    fontSize: 14,
    paddingLeft: 7,
    paddingRight: 12,
  },
});

type SelectedUserTagProps = {
  index: number;
  onPress: () => void;
  tag: unknown;
  disabled?: boolean;
};

export const SelectedUserTag: React.FC<SelectedUserTagProps> = ({
  disabled = false,
  index,
  onPress,
  tag,
}) => {
  const grey = '#808080';

  return (
    <TouchableOpacity
      disabled={disabled}
      key={`${tag}-${index}`}
      onPress={onPress}
      style={[styles.tagContainer, { backgroundColor: grey }]}
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
            color: grey,
          },
        ]}
      >
        {tag.name}
      </Text>
    </TouchableOpacity>
  );
};
