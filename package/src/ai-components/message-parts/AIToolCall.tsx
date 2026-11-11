import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { isDeclined, isToolCallFinished } from './parseMessageParts';
import type { AIToolCallPart } from './types';

import { useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { formatCallDuration } from '../internal/format';
import { Shimmer } from '../internal/Shimmer';
import { primitives } from '../internal/tokens';

export type AIToolCallProps = {
  part: AIToolCallPart;
};

/**
 * One tool call of a reply: what it is doing (its `displayTitle`, else its name), how it is
 * going, and how long it took once it is done. The counterpart of `AIToolCallView`.
 */
export const AIToolCall = ({ part }: AIToolCallProps) => {
  const { t, userLanguage } = useAITranslation();
  const {
    theme: { colors, messageParts },
  } = useTheme();
  const { Cancelled, Check, Device, Failed, HandRaised, Key } = useAIIcons();

  const title = part.displayTitle ?? part.name.replace(/_/g, ' ');
  const detail = (() => {
    if (isDeclined(part)) return part.summary ?? t('Declined');
    switch (part.status) {
      case 'awaiting_approval':
        return part.summary ?? t('Waiting for approval');
      case 'awaiting_authorization':
        return part.summary ?? t('Waiting for you to sign in');
      case 'awaiting_client':
        return part.summary ?? t('Waiting for the device');
      case 'failed':
        return part.summary ?? t("Didn't complete");
      case 'cancelled':
        return part.summary ?? t('Cancelled');
      default:
        return part.summary;
    }
  })();

  // A status this SDK doesn't know reads as still in progress.
  const icon = (() => {
    switch (part.status) {
      case 'awaiting_approval':
        return <HandRaised color={colors.accent_blue} />;
      case 'awaiting_authorization':
        return <Key color={colors.accent_blue} />;
      case 'awaiting_client':
        return <Device color={colors.accent_blue} />;
      case 'completed':
        return <Check color={messageParts?.successColor ?? colors.accent_blue} />;
      case 'failed':
        return <Failed color={colors.accent_red} />;
      case 'cancelled':
        return <Cancelled color={colors.grey} />;
      default:
        return <ActivityIndicator color={colors.accent_blue} size='small' style={styles.spinner} />;
    }
  })();

  const finished = isToolCallFinished(part.status);
  const waiting = part.status.startsWith('awaiting_');

  return (
    <View style={[styles.container, messageParts?.toolCall?.container]} testID='ai-tool-call'>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.text}>
        <Shimmer active={waiting} style={styles.titleShimmer}>
          <Text style={[styles.title, { color: colors.black }, messageParts?.toolCall?.title]}>
            {title}
          </Text>
        </Shimmer>
        {detail ? (
          <Text
            numberOfLines={2}
            style={[styles.detail, { color: colors.grey }, messageParts?.toolCall?.detail]}
          >
            {detail}
          </Text>
        ) : null}
      </View>
      {finished && part.durationMs !== undefined ? (
        <Text style={[styles.duration, { color: colors.grey }, messageParts?.toolCall?.duration]}>
          {formatCallDuration(part.durationMs / 1000, userLanguage)}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  detail: {
    fontSize: primitives.typographyFontSizeXs,
    lineHeight: primitives.typographyLineHeightTight,
  },
  duration: {
    fontSize: primitives.typographyFontSizeXs,
    fontVariant: ['tabular-nums'],
    lineHeight: primitives.typographyLineHeightNormal,
  },
  icon: { marginTop: 2 },
  // The platform spinner, sized to the 16 the icons are drawn at.
  spinner: { height: 16, transform: [{ scale: 0.8 }], width: 16 },
  text: { flex: 1, gap: 2, minWidth: 0 },
  title: {
    fontSize: primitives.typographyFontSizeSm,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  titleShimmer: { alignSelf: 'flex-start' },
});
