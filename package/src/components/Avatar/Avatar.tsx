import React, { useCallback, useMemo } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { CircleProps } from 'react-native-svg';

import { useChatConfigContext } from '../../contexts/chatConfigContext/ChatConfigContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useLoadingImage } from '../../hooks/useLoadingImage';
import { getResizedImageUrl } from '../../utils/getResizedImageUrl';
import { OnlineIndicator } from '../ui/OnlineIndicator';

const randomImageBaseUrl = 'https://getstream.io/random_png/';
const randomSvgBaseUrl = 'https://getstream.io/random_svg/';
const streamCDN = 'stream-io-cdn.com';

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
    .join('');

export type AvatarProps = {
  /** size in pixels */
  size: number;
  containerStyle?: StyleProp<ViewStyle>;
  /** image url */
  image?: string;
  ImageComponent?: React.ComponentType<ImageProps>;
  /** name of the picture, used for fallback */
  imageStyle?: StyleProp<ImageStyle>;
  name?: string;
  online?: boolean;
  presenceIndicator?: CircleProps;
  testID?: string;
};

/**
 * Avatar - A round avatar image with fallback to user's initials.
 */
export const Avatar = (props: AvatarProps) => {
  const {
    containerStyle,
    image: imageProp,
    ImageComponent = Image,
    imageStyle,
    name,
    online = false,
    size,
    testID,
  } = props;
  const { resizableCDNHosts } = useChatConfigContext();
  const {
    theme: {
      avatar: { container, image, presenceIndicatorContainer },
    },
  } = useTheme();

  const { isLoadingImageError, setLoadingImageError } = useLoadingImage();

  const onError = useCallback(() => {
    setLoadingImageError(true);
  }, [setLoadingImageError]);

  const uri = useMemo(() => {
    let imageUrl;
    if (
      !imageProp ||
      imageProp.includes(randomImageBaseUrl) ||
      imageProp.includes(randomSvgBaseUrl)
    ) {
      if (imageProp?.includes(streamCDN)) {
        imageUrl = imageProp;
      } else {
        imageUrl = `${randomImageBaseUrl}${name ? `?name=${getInitials(name)}&size=${size}` : ''}`;
      }
    } else {
      imageUrl = getResizedImageUrl({
        height: size,
        resizableCDNHosts,
        url: imageProp,
        width: size,
      });
    }

    return imageUrl;
  }, [imageProp, name, size, resizableCDNHosts]);

  return (
    <View>
      <View
        style={[
          styles.container,
          {
            borderRadius: size / 2,
            height: size,
            width: size,
          },
          container,
          containerStyle,
        ]}
      >
        {isLoadingImageError ? (
          <View
            style={{
              backgroundColor: '#ececec',
              borderRadius: size / 2,
              height: size,
              width: size,
            }}
          />
        ) : (
          <ImageComponent
            accessibilityLabel={testID ?? 'Avatar Image'}
            onError={onError}
            source={{
              uri,
            }}
            style={[
              image,
              size
                ? {
                    backgroundColor: '#ececec',
                    borderRadius: size / 2,
                    height: size,
                    width: size,
                  }
                : {},
              imageStyle,
            ]}
            testID={testID ?? 'avatar-image'}
          />
        )}
      </View>
      {online ? (
        <View style={[styles.presenceIndicatorContainer, presenceIndicatorContainer]}>
          <OnlineIndicator online={online} size='md' />
        </View>
      ) : null}
    </View>
  );
};

Avatar.displayName = 'Avatar';
