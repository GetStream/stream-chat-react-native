import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Grid as GridIconDefault, Share as ShareIconDefault } from '../../../icons';
import { deleteFile, saveFile, shareImage } from '../../../native';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { Photo } from '../ImageGallery';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(SafeAreaView)
  : SafeAreaView;

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
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  wrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});

export type ImageGalleryFooterCustomComponent<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ({
  openGridView,
  photo,
  share,
  shareMenuOpen,
}: {
  openGridView: () => void;
  share: () => Promise<void>;
  shareMenuOpen: boolean;
  photo?: Photo<StreamChatClient>;
}) => React.ReactElement | null;

export type ImageGalleryFooterCustomComponentProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  centerElement?: ImageGalleryFooterCustomComponent<StreamChatClient>;
  GridIcon?: React.ReactElement;
  leftElement?: ImageGalleryFooterCustomComponent<StreamChatClient>;
  rightElement?: ImageGalleryFooterCustomComponent<StreamChatClient>;
  ShareIcon?: React.ReactElement;
};

type Props<StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  ImageGalleryFooterCustomComponentProps<StreamChatClient> & {
    opacity: Animated.SharedValue<number>;
    openGridView: () => void;
    photo: Photo<StreamChatClient>;
    photoLength: number;
    selectedIndex: number;
    visible: Animated.SharedValue<number>;
  };

export const ImageGalleryFooter = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: Props<StreamChatClient>,
) => {
  const {
    centerElement,
    GridIcon,
    leftElement,
    opacity,
    openGridView,
    photo,
    photoLength,
    rightElement,
    selectedIndex,
    ShareIcon,
    visible,
  } = props;
  const [height, setHeight] = useState(200);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const {
    theme: {
      colors: { black, white },
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
          translateY: interpolate(visible.value, [0, 1], [height, 0], Extrapolate.CLAMP),
        },
      ],
    }),
    [],
  );

  const share = async () => {
    setShareMenuOpen(true);
    try {
      const localImage = await saveFile({
        fileName: `${photo.user?.id || 'ChatPhoto'}-${photo.messageId}-${selectedIndex}.jpg`,
        fromUrl: photo.uri,
      });
      await shareImage({ type: 'image/jpeg', url: localImage });
      await deleteFile({ uri: localImage });
    } catch (error) {
      console.log(error);
    }
    setShareMenuOpen(false);
  };

  return (
    <Animated.View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
      style={styles.wrapper}
    >
      <ReanimatedSafeAreaView style={[{ backgroundColor: white }, container, footerStyle]}>
        <View style={[styles.innerContainer, innerContainer]}>
          {leftElement ? (
            leftElement({ openGridView, photo, share, shareMenuOpen })
          ) : (
            <TouchableOpacity disabled={shareMenuOpen} onPress={share}>
              <View style={[styles.leftContainer, leftContainer]}>
                {ShareIcon ? ShareIcon : <ShareIconDefault />}
              </View>
            </TouchableOpacity>
          )}
          {centerElement ? (
            centerElement({ openGridView, photo, share, shareMenuOpen })
          ) : (
            <View style={[styles.centerContainer, centerContainer]}>
              <Text style={[styles.imageCountText, { color: black }, imageCountText]}>
                {t('{{ index }} of {{ photoLength }}', {
                  index: photoLength - selectedIndex,
                  photoLength,
                })}
              </Text>
            </View>
          )}
          {rightElement ? (
            rightElement({ openGridView, photo, share, shareMenuOpen })
          ) : (
            <TouchableOpacity onPress={openGridView}>
              <View style={[styles.rightContainer, rightContainer]}>
                {GridIcon ? GridIcon : <GridIconDefault />}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ReanimatedSafeAreaView>
    </Animated.View>
  );
};

ImageGalleryFooter.displayName = 'ImageGalleryFooter{imageGallery{footer}}';
