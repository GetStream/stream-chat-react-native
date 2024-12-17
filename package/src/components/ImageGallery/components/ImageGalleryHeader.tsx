import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { useOverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Close } from '../../../icons';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { getDateString } from '../../../utils/i18n/getDateString';
import type { Photo } from '../ImageGallery';

export type ImageGalleryHeaderCustomComponent<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ({
  hideOverlay,
  photo,
}: {
  hideOverlay: () => void;
  photo?: Photo<StreamChatGenerics>;
}) => React.ReactElement | null;

export type ImageGalleryHeaderCustomComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  centerElement?: ImageGalleryHeaderCustomComponent<StreamChatGenerics>;
  CloseIcon?: React.ReactElement;
  leftElement?: ImageGalleryHeaderCustomComponent<StreamChatGenerics>;
  rightElement?: ImageGalleryHeaderCustomComponent<StreamChatGenerics>;
};

type Props<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  ImageGalleryHeaderCustomComponentProps<StreamChatGenerics> & {
    opacity: SharedValue<number>;
    visible: SharedValue<number>;
    photo?: Photo<StreamChatGenerics>;
    /* Lookup key in the language corresponding translations sheet to perform date formatting */
  };

export const ImageGalleryHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: Props<StreamChatGenerics>,
) => {
  const { centerElement, CloseIcon, leftElement, opacity, photo, rightElement, visible } = props;
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
  const { setOverlay } = useOverlayContext();

  const date = useMemo(
    () =>
      getDateString({
        date: photo?.created_at,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/ImageGalleryHeader',
      }),
    [photo?.created_at, t, tDateTimeParser],
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

  return (
    <View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
    >
      <SafeAreaView style={[{ backgroundColor: white }, container, headerStyle]}>
        <View style={[styles.innerContainer, innerContainer]}>
          {leftElement ? (
            leftElement({ hideOverlay, photo })
          ) : (
            <Pressable accessibilityLabel='Hide Overlay' onPress={hideOverlay}>
              <View style={[styles.leftContainer, leftContainer]}>
                {CloseIcon ? CloseIcon : <Close />}
              </View>
            </Pressable>
          )}
          {centerElement ? (
            centerElement({ hideOverlay, photo })
          ) : (
            <View style={[styles.centerContainer, centerContainer]}>
              <Text style={[styles.userName, { color: black }, usernameText]}>
                {photo?.user?.name || photo?.user?.id || t<string>('Unknown User')}
              </Text>
              {date && <Text style={[styles.date, { color: black }, dateText]}>{date}</Text>}
            </View>
          )}
          {rightElement ? (
            rightElement({ hideOverlay, photo })
          ) : (
            <View style={[styles.rightContainer, rightContainer]} />
          )}
        </View>
      </SafeAreaView>
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
