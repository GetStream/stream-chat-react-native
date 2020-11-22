import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, CircleProps } from 'react-native-svg';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const randomImageBaseUrl = 'https://getstream.io/random_png/';
const randomSvgBaseUrl = 'https://getstream.io/random_svg/';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  presenceIndicatorContainer: {
    height: 12,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
  },
});

const getInitials = (fullName: string) =>
  fullName
    .split(' ')
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join(' ');

export type AvatarProps = {
  /** size in pixels */
  size: number;
  containerStyle?: StyleProp<ViewStyle>;
  /** image url */
  image?: string;
  /** name of the picture, used for fallback */
  name?: string;
  online?: boolean;
  presenceIndicator?: CircleProps;
  presenceIndicatorContainerStyle?: StyleProp<ViewStyle>;
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
    image: imageProp,
    name,
    online,
    presenceIndicator: presenceIndicatorProp,
    presenceIndicatorContainerStyle,
    size,
    testID,
  } = props;
  const {
    theme: {
      avatar: {
        container,
        image,
        presenceIndicator,
        presenceIndicatorContainer,
      },
    },
  } = useTheme();

  const [imageError, setImageError] = useState(false);

  return (
    <View>
      <View
        style={[
          styles.container,
          container,
          containerStyle,
          {
            borderRadius: size / 2,
            height: size,
            width: size,
          },
        ]}
      >
        <Image
          accessibilityLabel={testID || 'avatar-image'}
          onError={() => setImageError(true)}
          source={{
            uri:
              imageError ||
              !imageProp ||
              imageProp.includes(randomImageBaseUrl) ||
              imageProp.includes(randomSvgBaseUrl)
                ? `${randomImageBaseUrl}${
                    name ? `?name=${getInitials(name)}&size=${size}` : ''
                  }`
                : imageProp,
          }}
          style={[
            image,
            size
              ? {
                  borderRadius: size / 2,
                  height: size,
                  resizeMode: 'contain',
                  width: size,
                }
              : {},
          ]}
          testID={testID || 'avatar-image'}
        />
      </View>
      {online && (
        <View
          style={[
            styles.presenceIndicatorContainer,
            presenceIndicatorContainer,
            presenceIndicatorContainerStyle,
          ]}
        >
          <Svg>
            <Circle {...presenceIndicator} {...presenceIndicatorProp} />
          </Svg>
        </View>
      )}
    </View>
  );
};

Avatar.displayName = 'Avatar{avatar}';
