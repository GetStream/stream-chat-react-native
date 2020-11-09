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

import {
  isDayOrMoment,
  useOverlayContext,
  useTranslationContext,
} from '../../../contexts';
import { Left } from '../../../icons';

import type { Photo } from '../ImageGallery';

import type { DefaultUserType, UnknownType } from '../../../types/types';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    height: 56,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.5,
  },
  left: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  right: {
    marginRight: 8,
    width: 24, // Width of icon currently on left
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
});

type Props<Us extends UnknownType = DefaultUserType> = {
  opacity: Animated.SharedValue<number>;
  visible: Animated.SharedValue<number>;
  photo?: Photo<Us>;
};

export const ImageGalleryHeader = <Us extends UnknownType = DefaultUserType>(
  props: Props<Us>,
) => {
  const { opacity, photo, visible } = props;
  const [height, setHeight] = useState(200);
  const { t, tDateTimeParser } = useTranslationContext();
  const { setBlurType, setOverlay } = useOverlayContext();

  const dateString = photo
    ? typeof photo.created_at === 'string'
      ? photo.created_at
      : photo.created_at?.asMutable().toDateString()
    : undefined;

  const parsedDate = tDateTimeParser(dateString);
  const date =
    parsedDate && isDayOrMoment(parsedDate)
      ? parsedDate.calendar()
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
      <ReanimatedSafeAreaView style={[styles.safeArea, headerStyle]}>
        <View style={styles.container}>
          <TouchableOpacity onPress={hideOverlay}>
            <View style={styles.left}>
              <Left />
            </View>
          </TouchableOpacity>
          <View style={styles.centerContainer}>
            <Text style={styles.userName}>
              {photo?.user?.name || t('Unknown User')}
            </Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <View style={styles.right} />
        </View>
      </ReanimatedSafeAreaView>
    </View>
  );
};
