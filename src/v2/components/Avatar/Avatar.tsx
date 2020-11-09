import React, { useState } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
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
  /** size in pixels */
  size: number;
  containerStyle?: StyleProp<ViewStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
  /** image url */
  image?: string;
  /** name of the picture, used for title tag fallback */
  name?: string;
  testID?: string;
};

/**
 * Avatar - A round avatar image with fallback to user's initials
 *
 * @example ./Avatar.md
 */
export const Avatar: React.FC<AvatarProps> = (props) => {
  const {
    containerStyle,
    fallbackStyle,
    image: imageProp,
    name,
    size,
    testID,
  } = props;
  const {
    theme: {
      avatar: {
        BASE_AVATAR_FALLBACK_TEXT_SIZE,
        BASE_AVATAR_SIZE,
        container,
        fallback,
        image,
        text,
      },
    },
  } = useTheme();

  const [imageError, setImageError] = useState(false);

  return (
    <View style={[styles.container, container, containerStyle]}>
      {imageProp && !imageError ? (
        <Image
          accessibilityLabel='initials'
          onError={() => setImageError(true)}
          resizeMethod='resize'
          source={{ uri: imageProp }}
          style={[
            image,
            size ? { borderRadius: size / 2, height: size, width: size } : {},
          ]}
          testID={testID || 'avatar-image'}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            fallback,
            size
              ? {
                  borderRadius: size / 2,
                  height: size,
                  width: size,
                }
              : {},
            fallbackStyle,
          ]}
        >
          <Text
            style={[
              styles.text,
              text,
              size
                ? {
                    fontSize:
                      BASE_AVATAR_FALLBACK_TEXT_SIZE *
                      (size / BASE_AVATAR_SIZE),
                  }
                : {},
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
