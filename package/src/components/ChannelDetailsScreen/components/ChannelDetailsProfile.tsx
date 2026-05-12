import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';
import { useIsDirectChat } from '../../ChannelList/hooks/useIsDirectChat';
import { useChannelPreviewDisplayName } from '../../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { ChannelAvatar } from '../../ui/Avatar/ChannelAvatar';
import { useChannelDetailsMemberStatusText } from '../hooks/useChannelDetailsMemberStatusText';

export const ChannelDetailsProfile = () => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
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
  const isDirect = useIsDirectChat(channel);
  const members = useChannelMembersState(channel);
  const displayName = useChannelPreviewDisplayName(channel);
  const groupStatusText = useChannelDetailsMemberStatusText(channel);
  const styles = useStyles();

  const subtitle = useMemo(() => {
    if (!isDirect) return groupStatusText;
    const otherMember = Object.values(members).find(
      (member) => member.user?.id !== channel.getClient().userID,
    );
    return otherMember?.user?.online ? t('Online') : '';
  }, [channel, groupStatusText, isDirect, members, t]);

  return (
    <View style={[styles.container, containerOverride]}>
      <ChannelAvatar channel={channel} showBorder={false} size='2xl' />
      <View style={[styles.heading, headingOverride]}>
        <Text
          accessibilityRole='header'
          numberOfLines={2}
          style={[styles.title, { color: semantics.textPrimary }, titleOverride]}
        >
          {displayName ?? ''}
        </Text>
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
        },
        title: {
          fontSize: primitives.typographyFontSizeXl,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightRelaxed,
          textAlign: 'center',
        },
      }),
    [],
  );
};
