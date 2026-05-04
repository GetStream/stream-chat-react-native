import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Channel } from 'stream-chat';

import { AIStates, useAIState } from './hooks/useAIState';

import { useAnnounceOnStateChange } from '../../a11y/hooks/useAnnounceOnStateChange';
import { useChannelContext, useTheme, useTranslationContext } from '../../contexts';
import { primitives } from '../../theme';

export type AITypingIndicatorViewProps = {
  channel?: Channel;
};

export const AITypingIndicatorView = ({
  channel: channelFromProps,
}: AITypingIndicatorViewProps) => {
  const { t } = useTranslationContext();
  const { channel: channelFromContext } = useChannelContext();
  const channel = channelFromProps || channelFromContext;
  const { aiState } = useAIState(channel);
  const allowedStates = {
    [AIStates.Thinking]: t('Thinking...'),
    [AIStates.Generating]: t('Generating...'),
  };

  const styles = useStyles();
  const announceableState = aiState in allowedStates ? allowedStates[aiState] : null;
  useAnnounceOnStateChange(announceableState);

  return aiState in allowedStates ? (
    <View accessibilityLiveRegion='polite' accessibilityRole='text' style={styles.container}>
      <Text style={styles.text}>{allowedStates[aiState]}</Text>
    </View>
  ) : null;
};

AITypingIndicatorView.displayName = 'AITypingIndicatorView{messageItemView{content}}';

const useStyles = () => {
  const {
    theme: {
      aiTypingIndicatorView: { container, text },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: semantics.backgroundCoreSurfaceDefault,
        paddingHorizontal: primitives.spacingMd,
        paddingVertical: primitives.spacingLg,
        ...container,
      },
      text: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        ...text,
      },
    });
  }, [container, text, semantics]);
};
