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

import { useOverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  useTranslationContext,
} from '../../../contexts/translationContext/TranslationContext';
import { Close } from '../../../icons';

import type { Photo } from '../ImageGallery';

import type { DefaultUserType, UnknownType } from '../../../types/types';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(SafeAreaView)
  : SafeAreaView;

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.5,
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
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export type ImageGalleryHeaderCustomComponent<
  Us extends UnknownType = DefaultUserType
> = ({
  hideOverlay,
  photo,
}: {
  hideOverlay: () => void;
  photo?: Photo<Us>;
}) => React.ReactElement | null;

export type ImageGalleryHeaderCustomComponentProps<
  Us extends UnknownType = DefaultUserType
> = {
  centerElement?: ImageGalleryHeaderCustomComponent<Us>;
  CloseIcon?: React.ReactElement;
  leftElement?: ImageGalleryHeaderCustomComponent<Us>;
  rightElement?: ImageGalleryHeaderCustomComponent<Us>;
};

type Props<
  Us extends UnknownType = DefaultUserType
> = ImageGalleryHeaderCustomComponentProps<Us> & {
  opacity: Animated.SharedValue<number>;
  visible: Animated.SharedValue<number>;
  photo?: Photo<Us>;
};

export const ImageGalleryHeader = <Us extends UnknownType = DefaultUserType>(
  props: Props<Us>,
) => {
  const {
    centerElement,
    CloseIcon,
    leftElement,
    opacity,
    photo,
    rightElement,
    visible,
  } = props;
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
  const { setBlurType, setOverlay } = useOverlayContext();

  const parsedDate = tDateTimeParser(photo?.created_at);

  /**
   * .calendar is required on moment types, but in reality it
   * is unavailable on first render. We therefore check if it
   * is available and call it, otherwise we call .fromNow.
   */
  const date =
    parsedDate && isDayOrMoment(parsedDate)
      ? parsedDate.calendar
        ? parsedDate.calendar()
        : parsedDate.fromNow()
      : parsedDate;

  const headerStyle = useAnimatedStyle<ViewStyle>(() => ({
    opacity: opacity.value,
    transform: [
      {
        translateY: interpolate(
          visible.value,
          [0, 1],
          [-height, 0],
          Extrapolate.CLAMP,
        ),
      },
    ],
  }));

  const hideOverlay = () => {
    setOverlay('none');
    setBlurType(undefined);
  };

  return (
    <View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
    >
      <ReanimatedSafeAreaView
        style={[{ backgroundColor: white }, container, headerStyle]}
      >
        <View style={[styles.innerContainer, innerContainer]}>
          {leftElement ? (
            leftElement({ hideOverlay, photo })
          ) : (
            <TouchableOpacity onPress={hideOverlay}>
              <View style={[styles.leftContainer, leftContainer]}>
                {CloseIcon ? CloseIcon : <Close />}
              </View>
            </TouchableOpacity>
          )}
          {centerElement ? (
            centerElement({ hideOverlay, photo })
          ) : (
            <View style={[styles.centerContainer, centerContainer]}>
              <Text style={[styles.userName, { color: black }, usernameText]}>
                {photo?.user?.name || t('Unknown User')}
              </Text>
              <Text style={[styles.date, { color: black }, dateText]}>
                {date}
              </Text>
            </View>
          )}
          {rightElement ? (
            rightElement({ hideOverlay, photo })
          ) : (
            <View style={[styles.rightContainer, rightContainer]} />
          )}
        </View>
      </ReanimatedSafeAreaView>
    </View>
  );
};

ImageGalleryHeader.displayName = 'ImageGalleryHeader{imageGallery{header}}';
