import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const BASE_AVATAR_FALLBACK_TEXT_SIZE = 14;
const BASE_AVATAR_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

const getInitials = (fullName?: string) =>
  fullName
    ? fullName
        .split(' ')
        .slice(0, 2)
        .map((name) => name.charAt(0))
    : null;

export type AvatarProps = {
  /** image url */
  image?: string;
  /** name of the picture, used for title tag fallback */
  name?: string;
  /** size in pixels */
  size?: number;
  testID?: string;
};

/**
 * Avatar - A round avatar image with fallback to user's initials
 *
 * @example ./Avatar.md
 */
export const Avatar: React.FC<AvatarProps> = (props) => {
  const { image: imageProp, name, size = BASE_AVATAR_SIZE, testID } = props;
  const {
    theme: {
      avatar: { container, fallback, image, text },
      colors: { primary, textLight },
    },
  } = useTheme();

  const [imageError, setImageError] = useState(false);

  return (
    <View style={[styles.container, container]}>
      {imageProp && !imageError ? (
        <Image
          accessibilityLabel='initials'
          onError={() => setImageError(true)}
          resizeMethod='resize'
          source={{ uri: imageProp }}
          style={[{ borderRadius: size / 2, height: size, width: size }, image]}
          testID={testID || 'avatar-image'}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              backgroundColor: primary,
              borderRadius: size / 2,
              height: size,
              width: size,
            },
            fallback,
          ]}
        >
          <Text
            style={[
              {
                color: textLight,
                fontSize:
                  BASE_AVATAR_FALLBACK_TEXT_SIZE * (size / BASE_AVATAR_SIZE),
              },
              text,
            ]}
            testID={testID || 'avatar-text'}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}
    </View>
  );
};

Avatar.displayName = 'Avatar{avatar}';
