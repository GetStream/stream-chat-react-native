import React, { useMemo } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { BlurView } from '@react-native-community/blur';
import type { ComponentOverrides } from 'stream-chat-react-native';
import { useTheme } from 'stream-chat-react-native';

import { CustomAttachmentPickerContent } from './AttachmentPickerContent';
import { FastImageAdapter } from './FastImageAdapter';
import { MessageLocation } from './LocationSharing/MessageLocation';
import type { MessageOverlayBackdropConfigItem } from './SecretMenu';

const MessageOverlayBlurBackground: NonNullable<
  ComponentOverrides['MessageOverlayBackground']
> = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const isIOS = Platform.OS === 'ios';

  return (
    <>
      <BlurView
        blurAmount={isIOS ? 10 : 6}
        blurRadius={isIOS ? undefined : 6}
        blurType={isDark ? 'dark' : 'light'}
        downsampleFactor={isIOS ? undefined : 12}
        pointerEvents='none'
        reducedTransparencyFallbackColor='rgba(0, 0, 0, 0.8)'
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: semantics.backgroundCoreScrim }]} />
    </>
  );
};

const RenderNull = () => null;

export const useSampleAppComponentOverrides = (
  messageOverlayBackdrop?: MessageOverlayBackdropConfigItem['value'],
) =>
  useMemo<ComponentOverrides>(
    () => ({
      AttachmentPickerContent: CustomAttachmentPickerContent,
      ChannelListHeaderNetworkDownIndicator: RenderNull,
      ImageComponent: FastImageAdapter,
      MessageLocation,
      NetworkDownIndicator: RenderNull,
      ...(messageOverlayBackdrop === 'blurview'
        ? { MessageOverlayBackground: MessageOverlayBlurBackground }
        : {}),
    }),
    [messageOverlayBackdrop],
  );
