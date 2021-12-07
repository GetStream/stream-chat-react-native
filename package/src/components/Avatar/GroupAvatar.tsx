import React, { useState } from 'react';
import { Image, PixelRatio, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const randomImageBaseUrl = 'https://getstream.io/random_png/';
const randomSvgBaseUrl = 'https://getstream.io/random_svg/';
const streamCDN = 'stream-io-cdn.com';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  flex: { flex: 1 },
});

const getInitials = (fullName: string) =>
  fullName
    .split(' ')
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join(' ');

export type GroupAvatarProps = {
  /** total size in pixels */
  size: number;
  containerStyle?: StyleProp<ViewStyle>;
  /** image urls */
  images?: string[];
  /** name of the users, used for fallback */
  names?: string[];
  testID?: string;
};

/**
 * GroupAvatar - A round group of avatar images with fallbacks to users' initials
 */
export const GroupAvatar: React.FC<GroupAvatarProps> = (props) => {
  const { containerStyle, images, names, size, testID } = props;
  const {
    theme: {
      groupAvatar: { container, image },
    },
  } = useTheme();

  const [imageError, setImageError] = useState(false);

  /**
   * [
   *    [
   *        { height: number; name: string; url: string; width: number },
   *        { height: number; name: string; url: string; width: number },
   *    ],
   *    [
   *        { height: number; name: string; url: string; width: number },
   *        { height: number; name: string; url: string; width: number },
   *    ],
   * ]
   */
  const imagesOrNames = images || names || [];
  const avatarImages = imagesOrNames.slice(0, 4).reduce((returnArray, currentImage, index) => {
    const url = currentImage.startsWith('http')
      ? currentImage
      : `${randomImageBaseUrl}${
          names
            ? `?name=${getInitials(names[index])}&size=${
                imagesOrNames.length <= 2 ? size : size / 2
              }`
            : ''
        }`;
    if (imagesOrNames.length <= 2) {
      returnArray[0] = [
        ...(returnArray[0] || []),
        {
          height: imagesOrNames.length === 1 ? size : size / 2,
          name: names ? names[index] : '',
          url,
          width: size,
        },
      ];
    } else {
      if (index < 2) {
        returnArray[0] = [
          ...(returnArray[0] || []),
          {
            height: size / 2,
            name: names ? names[index] : '',
            url,
            width: size / 2,
          },
        ];
      } else {
        returnArray[1] = [
          ...(returnArray[1] || []),
          {
            height: size / 2,
            name: names ? names[index] : '',
            url,
            width: imagesOrNames.length === 3 ? size : size / 2,
          },
        ];
      }
    }
    return returnArray;
  }, [] as { height: number; name: string; url: string; width: number }[][]);

  return (
    <View
      style={[
        styles.container,
        { borderRadius: size / 2, height: size, width: size },
        container,
        containerStyle,
      ]}
      testID={testID || 'group-avatar'}
    >
      {avatarImages.map((column, colIndex) => (
        <View
          key={`avatar-column-${colIndex}`}
          style={[
            styles.flex,
            {
              flexDirection: imagesOrNames.length === 2 ? 'column' : 'row',
            },
          ]}
        >
          {column.map(({ height, name, url, width }, rowIndex) => (
            <Image
              accessibilityLabel={testID || 'avatar-image'}
              key={`avatar-${url}-${rowIndex}`}
              onError={() => setImageError(true)}
              source={{
                uri:
                  imageError || url.includes(randomSvgBaseUrl)
                    ? url.includes(streamCDN)
                      ? url
                      : `${randomImageBaseUrl}${
                          name ? `?name=${getInitials(name)}&size=${height}` : ''
                        }`
                    : url.replace('h=%2A', `h=${PixelRatio.getPixelSizeForLayoutSize(height)}`),
              }}
              style={[
                image,
                size
                  ? {
                      height,
                      width,
                    }
                  : {},
              ]}
              testID={`group-avatar-image-${colIndex}-${rowIndex}`}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

GroupAvatar.displayName = 'GroupAvatar{groupAvatar}';
