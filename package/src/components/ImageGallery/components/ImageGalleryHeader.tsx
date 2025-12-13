import React, { useMemo, useState } from 'react';

import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useOverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { Close } from '../../../icons';

import { ImageGalleryState } from '../../../state-store/image-gallery-state-store';
import { getDateString } from '../../../utils/i18n/getDateString';
import { SafeAreaView } from '../../UIComponents/SafeAreaViewWrapper';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(SafeAreaView)
  : SafeAreaView;

export type ImageGalleryHeaderCustomComponent = ({
  hideOverlay,
}: {
  hideOverlay: () => void;
}) => React.ReactElement | null;

export type ImageGalleryHeaderCustomComponentProps = {
  centerElement?: ImageGalleryHeaderCustomComponent;
  CloseIcon?: React.ReactElement;
  leftElement?: ImageGalleryHeaderCustomComponent;
  rightElement?: ImageGalleryHeaderCustomComponent;
};

type Props = ImageGalleryHeaderCustomComponentProps & {
  opacity: SharedValue<number>;
  visible: SharedValue<number>;
};

const imageGallerySelector = (state: ImageGalleryState) => ({
  currentIndex: state.currentIndex,
});

export const ImageGalleryHeader = (props: Props) => {
  const { centerElement, CloseIcon, leftElement, opacity, rightElement, visible } = props;
  const [height, setHeight] = useState(200);
  const {
    theme: {
      colors: { black, white },
      imageGallery: {
        header: {
          centerContainer,
          container,
          dateText,
          innerContainer,
          leftContainer,
          rightContainer,
          usernameText,
        },
      },
    },
  } = useTheme();
  const { t, tDateTimeParser } = useTranslationContext();
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { currentIndex } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);
  const { setOverlay } = useOverlayContext();
  const asset = imageGalleryStateStore.assets[currentIndex];

  const date = useMemo(
    () =>
      getDateString({
        date: asset?.created_at,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/ImageGalleryHeader',
      }),
    [asset?.created_at, t, tDateTimeParser],
  );

  const headerStyle = useAnimatedStyle<ViewStyle>(() => ({
    opacity: opacity.value,
    transform: [
      {
        translateY: interpolate(visible.value, [0, 1], [-height, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const hideOverlay = () => {
    setOverlay('none');
    imageGalleryStateStore.clear();
  };

  return (
    <View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
    >
      <ReanimatedSafeAreaView
        edges={['top']}
        style={[{ backgroundColor: white }, headerStyle, container]}
      >
        <View style={[styles.innerContainer, innerContainer]}>
          {leftElement ? (
            leftElement({ hideOverlay })
          ) : (
            <Pressable accessibilityLabel='Hide Overlay' onPress={hideOverlay}>
              <View style={[styles.leftContainer, leftContainer]}>
                {CloseIcon ? CloseIcon : <Close />}
              </View>
            </Pressable>
          )}
          {centerElement ? (
            centerElement({ hideOverlay })
          ) : (
            <View style={[styles.centerContainer, centerContainer]}>
              <Text style={[styles.userName, { color: black }, usernameText]}>
                {asset?.user?.name || asset?.user?.id || t('Unknown User')}
              </Text>
              {date && <Text style={[styles.date, { color: black }, dateText]}>{date}</Text>}
            </View>
          )}
          {rightElement ? (
            rightElement({ hideOverlay })
          ) : (
            <View style={[styles.rightContainer, rightContainer]} />
          )}
        </View>
      </ReanimatedSafeAreaView>
    </View>
  );
};

ImageGalleryHeader.displayName = 'ImageGalleryHeader{imageGallery{header}}';

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
});
