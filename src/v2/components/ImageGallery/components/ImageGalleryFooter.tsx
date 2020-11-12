import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Share as ShareIconDefault } from '../../../icons';
import { deleteFile, saveFile, shareImage } from '../../../native';

import type { Photo } from '../ImageGallery';

import type { DefaultUserType, UnknownType } from '../../../types/types';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  imageCountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  innerContainer: {
    flexDirection: 'row',
    height: 56,
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  rightContainer: {
    marginRight: 8,
    width: 24, // Width of icon currently on left
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

export type ImageGalleryFooterCustomComponent<
  Us extends UnknownType = DefaultUserType
> = ({
  photo,
  share,
}: {
  share: () => Promise<void>;
  photo?: Photo<Us>;
}) => React.ReactElement | null;

export type ImageGalleryFooterCustomComponentProps<
  Us extends UnknownType = DefaultUserType
> = {
  centerElement?: ImageGalleryFooterCustomComponent<Us>;
  leftElement?: ImageGalleryFooterCustomComponent<Us>;
  rightElement?: ImageGalleryFooterCustomComponent<Us>;
  ShareIcon?: React.ReactElement;
};

type Props<
  Us extends UnknownType = DefaultUserType
> = ImageGalleryFooterCustomComponentProps<Us> & {
  opacity: Animated.SharedValue<number>;
  photo: Photo<Us>;
  photoLength: number;
  selectedIndex: number;
  visible: Animated.SharedValue<number>;
};

export const ImageGalleryFooter = <Us extends UnknownType = DefaultUserType>(
  props: Props<Us>,
) => {
  const {
    centerElement,
    leftElement,
    opacity,
    photo,
    photoLength,
    rightElement,
    selectedIndex,
    ShareIcon,
    visible,
  } = props;
  const [height, setHeight] = useState(200);
  const {
    theme: {
      imageGallery: {
        footer: {
          centerContainer,
          container,
          imageCountText,
          innerContainer,
          leftContainer,
          rightContainer,
        },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  const footerStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: opacity.value,
      transform: [
        {
          translateY: interpolate(
            visible.value,
            [0, 1],
            [height, 0],
            Extrapolate.CLAMP,
          ),
        },
      ],
    }),
    [],
  );

  const share = async () => {
    try {
      const localImage = await saveFile({
        fileName: `${photo.user?.name || photo.user_id || 'ChatPhoto'}-${
          photo.messageId
        }-${selectedIndex}.jpg`,
        fromUrl: photo.uri,
      });
      /**
       * We add a 100ms timeout here as a wait, the file system seems to not
       * register the file as an image otherwise and does not present the full
       * sharing options for an image otherwise, likely file size related
       */
      await new Promise((resolve) => setTimeout(resolve, 100));
      await shareImage({ type: 'image/jpeg', url: localImage });
      await deleteFile({ uri: localImage });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Animated.View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
      style={styles.wrapper}
    >
      <ReanimatedSafeAreaView style={[styles.safeArea, container, footerStyle]}>
        <View style={[styles.innerContainer, innerContainer]}>
          {leftElement ? (
            leftElement({ photo, share })
          ) : (
            <TouchableOpacity onPress={share}>
              <View style={[styles.leftContainer, leftContainer]}>
                {ShareIcon ? ShareIcon : <ShareIconDefault />}
              </View>
            </TouchableOpacity>
          )}
          {centerElement ? (
            centerElement({ photo, share })
          ) : (
            <View style={[styles.centerContainer, centerContainer]}>
              <Text style={[styles.imageCountText, imageCountText]}>
                {t('{{ index }} of {{ photoLength }}', {
                  index: selectedIndex + 1,
                  photoLength,
                })}
              </Text>
            </View>
          )}
          {rightElement ? (
            rightElement({ photo, share })
          ) : (
            <View style={[styles.rightContainer, rightContainer]} />
          )}
        </View>
      </ReanimatedSafeAreaView>
    </Animated.View>
  );
};
