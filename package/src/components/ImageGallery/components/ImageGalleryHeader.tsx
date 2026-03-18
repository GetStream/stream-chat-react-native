import React, { useEffect, useMemo, useState } from 'react';

import { StyleSheet, Text, View, ViewStyle } from 'react-native';

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
import { ChevronLeft } from '../../../icons/ChevronLeft';

import { ImageGalleryState } from '../../../state-store/image-gallery-state-store';
import { primitives } from '../../../theme';
import { getDateString } from '../../../utils/i18n/getDateString';
import { Button } from '../../ui/Button/Button';
import { SafeAreaView } from '../../UIComponents/SafeAreaViewWrapper';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(SafeAreaView)
  : SafeAreaView;

export type ImageGalleryHeaderProps = {
  opacity: SharedValue<number>;
  visible: SharedValue<number>;
};

const imageGallerySelector = (state: ImageGalleryState) => ({
  asset: state.assets[state.currentIndex],
});

export const ImageGalleryHeader = (props: ImageGalleryHeaderProps) => {
  const { opacity, visible } = props;
  const [height, setHeight] = useState(200);
  const styles = useStyles();
  const { t, tDateTimeParser } = useTranslationContext();
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { asset } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);
  const { setOverlay } = useOverlayContext();

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
  };

  useEffect(() => {
    return () => {
      imageGalleryStateStore.clear();
    };
  }, [imageGalleryStateStore]);

  return (
    <View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
    >
      <ReanimatedSafeAreaView edges={['top']} style={[styles.container, headerStyle]}>
        <View style={styles.innerContainer}>
          <Button
            accessibilityLabel='Hide Overlay'
            variant='secondary'
            type='ghost'
            size='md'
            onPress={hideOverlay}
            LeadingIcon={ChevronLeft}
            iconOnly
          />
          <View style={styles.centerContainer} accessibilityLabel='Center element'>
            <Text style={styles.userName}>
              {asset?.user?.name || asset?.user?.id || t('Unknown User')}
            </Text>
            {date ? <Text style={styles.date}>{date}</Text> : null}
          </View>
          <View style={styles.rightContainer} accessibilityLabel='Right element' />
        </View>
      </ReanimatedSafeAreaView>
    </View>
  );
};

ImageGalleryHeader.displayName = 'ImageGalleryHeader{imageGallery{header}}';

const useStyles = () => {
  const {
    theme: {
      semantics,
      imageGallery: { header },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: semantics.backgroundCoreElevation1,
          gap: primitives.spacingXs,
          ...header.container,
        },
        centerContainer: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          gap: primitives.spacingXxs,
          ...header.centerContainer,
        },
        date: {
          color: semantics.textSecondary,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          ...header.dateText,
        },
        innerContainer: {
          padding: primitives.spacingSm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: semantics.borderCoreDefault,
          ...header.innerContainer,
        },
        rightContainer: {
          width: 24,
          height: 24,
        },
        userName: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          ...header.usernameText,
        },
      }),
    [semantics, header],
  );
};
