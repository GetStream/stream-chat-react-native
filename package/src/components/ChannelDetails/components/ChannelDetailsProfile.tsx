import React, { useMemo } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { composeAccessibilityLabel } from '../../../a11y/a11yUtils';
import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelMuteActive } from '../../../hooks/useChannelMuteActive';
import { Mute } from '../../../icons/mute';
import { primitives } from '../../../theme';
import { useChannelPreviewDisplayName } from '../../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { ChannelAvatar } from '../../ui/Avatar/ChannelAvatar';
import { useChannelDetailsMemberStatusText } from '../hooks/useChannelDetailsMemberStatusText';

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsProfile = () => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: {
        profile: {
          container: containerOverride,
          heading: headingOverride,
          subtitle: subtitleOverride,
          title: titleOverride,
        },
      },
      semantics,
    },
  } = useTheme();
  const displayName = useChannelPreviewDisplayName(channel);
  const subtitle = useChannelDetailsMemberStatusText(channel);
  const muted = useChannelMuteActive(channel);
  const styles = useStyles();

  return (
    <View style={[styles.container, containerOverride]}>
      <ChannelAvatar channel={channel} showBorder={false} size='2xl' />
      <View style={[styles.heading, headingOverride]}>
        <View
          accessibilityLabel={composeAccessibilityLabel(
            displayName,
            muted ? t('Muted') : undefined,
          )}
          accessibilityRole='header'
          accessible
          style={styles.titleRow}
        >
          <Text
            numberOfLines={2}
            style={[styles.title, { color: semantics.textPrimary }, titleOverride]}
          >
            {displayName ?? ''}
          </Text>
          {muted ? (
            <Mute
              fill={semantics.textTertiary}
              height={20}
              testID='channel-details-profile-muted-indicator'
              width={20}
            />
          ) : null}
        </View>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: semantics.textSecondary }, subtitleOverride]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          gap: primitives.spacingMd,
        },
        heading: {
          alignItems: 'center',
          gap: primitives.spacingXs,
          width: '100%',
        },
        subtitle: {
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          textAlign: 'center',
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        title: {
          flexShrink: 1,
          fontSize: primitives.typographyFontSizeXl,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightRelaxed,
          textAlign: 'center',
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingXs,
          justifyContent: 'center',
        },
      }),
    [],
  );
};
