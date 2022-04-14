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

export type ImageGalleryVideoControlCustomComponent<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ({
  openGridView,
  photo,
  share,
  shareMenuOpen,
}: {
  openGridView: () => void;
  share: () => Promise<void>;
  shareMenuOpen: boolean;
  photo?: Photo<StreamChatGenerics>;
}) => React.ReactElement | null;

export type ImageGalleryVideoControlCustomComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  centerElement?: ImageGalleryVideoControlCustomComponent<StreamChatGenerics>;
  GridIcon?: React.ReactElement;
  leftElement?: ImageGalleryVideoControlCustomComponent<StreamChatGenerics>;
  rightElement?: ImageGalleryVideoControlCustomComponent<StreamChatGenerics>;
  ShareIcon?: React.ReactElement;
};

type Props<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  ImageGalleryVideoControlCustomComponentProps<StreamChatGenerics> & {
    duration: number;
    opacity: Animated.SharedValue<number>;
    visible: Animated.SharedValue<number>;
  };

export const ImageGalleryVideoControl = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: Props<StreamChatGenerics>,
) => {
  const { duration, opacity, visible } = props;
  const [height, setHeight] = useState(200);
  const {
    theme: {
      colors: { black, white },
      imageGallery: {
        footer: { container },
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

  return (
    <Animated.View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
      style={styles.wrapper}
    >
      <ReanimatedSafeAreaView style={[{ backgroundColor: white }, container, footerStyle]}>
        <Text>{duration}</Text>
      </ReanimatedSafeAreaView>
    </Animated.View>
  );
};

ImageGalleryVideoControl.displayName = 'ImageGalleryVideoControl{imageGallery{videoControl}}';
