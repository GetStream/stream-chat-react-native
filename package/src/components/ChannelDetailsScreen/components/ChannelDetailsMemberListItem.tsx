import React, { useMemo } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { composeAccessibilityLabel } from '../../../a11y/a11yUtils';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import { UserAvatar } from '../../ui/Avatar/UserAvatar';
import { useUserActivityStatus } from '../hooks/useUserActivityStatus';

export type ChannelDetailsMemberListItemProps = {
  member: ChannelMemberResponse;
  isCurrentUser?: boolean;
};

const ChannelDetailsMemberListItemInner = ({
  isCurrentUser,
  member,
}: ChannelDetailsMemberListItemProps) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        memberItem: { container: containerOverride, name: nameOverride, status: statusOverride },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();
  const statusLine = useUserActivityStatus(member.user);

  const user = member.user;
  if (!user) return null;

  const displayName = isCurrentUser ? t('You') : (user.name ?? user.id);
  const accessibilityLabel = composeAccessibilityLabel(displayName, statusLine);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible
      style={[styles.container, containerOverride]}
    >
      <UserAvatar showOnlineIndicator={user.online} size='sm' user={user} />
      <View style={styles.body}>
        <Text
          numberOfLines={1}
          style={[styles.name, { color: semantics.textPrimary }, nameOverride]}
        >
          {displayName}
        </Text>
        {statusLine ? (
          <Text
            numberOfLines={1}
            style={[styles.status, { color: semantics.textTertiary }, statusOverride]}
          >
            {statusLine}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const areEqual = (
  prev: ChannelDetailsMemberListItemProps,
  next: ChannelDetailsMemberListItemProps,
) => {
  if (prev.isCurrentUser !== next.isCurrentUser) return false;
  if (prev.member === next.member) return true;
  const prevUser = prev.member.user;
  const nextUser = next.member.user;
  if (prevUser === nextUser) return prev.member.channel_role === next.member.channel_role;
  if (!prevUser || !nextUser) return false;
  return (
    prevUser.id === nextUser.id &&
    prevUser.name === nextUser.name &&
    prevUser.online === nextUser.online &&
    prevUser.image === nextUser.image &&
    prevUser.last_active === nextUser.last_active &&
    prev.member.channel_role === next.member.channel_role
  );
};

export const ChannelDetailsMemberListItem = React.memo(ChannelDetailsMemberListItemInner, areEqual);

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        body: {
          flex: 1,
          gap: 0,
          minWidth: 0,
        },
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingSm,
          minHeight: 48,
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingXs,
        },
        name: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        status: {
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightTight,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
      }),
    [],
  );
};
