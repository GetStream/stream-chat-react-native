import React, { useMemo } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { composeAccessibilityLabel } from '../../../../a11y/a11yUtils';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { Mute } from '../../../../icons';
import { primitives } from '../../../../theme';
import { UserAvatar } from '../../../ui/Avatar/UserAvatar';
import { useMemberRoleLabel } from '../../hooks/members/useMemberRoleLabel';
import { useUserActivityStatus } from '../../hooks/useUserActivityStatus';

export type ChannelMemberItemSize = 'sm' | 'lg';

export type ChannelMemberItemProps = {
  member: ChannelMemberResponse;
  /**
   * Whether the current user has muted this member. Compute once at the list level
   * (see `useMutedMemberIds`) and pass it down — when `true` a muted
   * indicator icon is rendered in the row's trailing area.
   */
  isMuted?: boolean;
  onPress?: () => void;
  /**
   * Visual size of the row.
   * - `'sm'` (default) renders the compact list row with a small avatar, regular-weight name, and a trailing role label.
   * - `'lg'` renders a profile-style header with a larger avatar, semibold name, larger status, and no role label.
   *   Useful for sheet / modal headers (e.g. the per-member actions bottom sheet).
   */
  size?: ChannelMemberItemSize;
  testID?: string;
};

const ChannelMemberItemInner = ({
  isMuted,
  member,
  onPress,
  size = 'sm',
  testID,
}: ChannelMemberItemProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const {
    theme: {
      channelDetailsScreen: {
        memberItem: {
          container: containerOverride,
          name: nameOverride,
          role: roleOverride,
          status: statusOverride,
        },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();
  const statusLine = useUserActivityStatus(member.user);
  const roleLabel = useMemberRoleLabel(member);

  const user = member.user;
  if (!user) return null;

  const isLarge = size === 'lg';
  const isCurrentUser = !!client?.userID && user.id === client.userID;
  const displayName = isCurrentUser ? t('You') : (user.name ?? user.id);
  const accessibilityLabel = composeAccessibilityLabel(
    displayName,
    roleLabel,
    isMuted ? t('Muted') : undefined,
    statusLine,
  );

  const content = (
    <>
      <UserAvatar showOnlineIndicator={user.online} size={isLarge ? 'lg' : 'md'} user={user} />
      <View style={styles.body}>
        <Text
          numberOfLines={1}
          style={[
            isLarge ? styles.nameLarge : styles.name,
            { color: semantics.textPrimary },
            nameOverride,
          ]}
        >
          {displayName}
        </Text>
        {statusLine ? (
          <Text
            numberOfLines={1}
            style={[
              isLarge ? styles.statusLarge : styles.status,
              { color: semantics.textTertiary },
              statusOverride,
            ]}
          >
            {statusLine}
          </Text>
        ) : null}
      </View>
      {isMuted || roleLabel ? (
        <View style={styles.trailing}>
          {isMuted ? (
            <Mute
              height={16}
              pathFill={semantics.textTertiary}
              testID='channel-member-muted-indicator'
              width={16}
            />
          ) : null}
          {roleLabel ? (
            <Text
              numberOfLines={1}
              style={[styles.role, { color: semantics.textTertiary }, roleOverride]}
            >
              {roleLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole='button'
        onPress={onPress}
        style={({ pressed }) => [
          isLarge ? styles.containerLarge : styles.container,
          pressed ? { backgroundColor: semantics.backgroundUtilityPressed } : null,
          containerOverride,
        ]}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={isLarge ? 'header' : undefined}
      accessible
      style={[isLarge ? styles.containerLarge : styles.container, containerOverride]}
      testID={testID}
    >
      {content}
    </View>
  );
};

const areEqual = (prev: ChannelMemberItemProps, next: ChannelMemberItemProps) => {
  if (prev.isMuted !== next.isMuted) return false;
  if (prev.onPress !== next.onPress) return false;
  if (prev.size !== next.size) return false;
  if (prev.testID !== next.testID) return false;
  if (prev.member === next.member) return true;
  if (prev.member.channel_role !== next.member.channel_role) return false;
  const prevUser = prev.member.user;
  const nextUser = next.member.user;
  if (prevUser === nextUser) return true;
  if (!prevUser || !nextUser) return false;
  return (
    prevUser.id === nextUser.id &&
    prevUser.name === nextUser.name &&
    prevUser.online === nextUser.online &&
    prevUser.image === nextUser.image &&
    prevUser.last_active === nextUser.last_active &&
    prevUser.role === nextUser.role
  );
};

export const ChannelMemberItem = React.memo(ChannelMemberItemInner, areEqual);

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
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: primitives.spacingXs,
        },
        containerLarge: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingSm,
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingSm,
        },
        name: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        nameLarge: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        role: {
          flexShrink: 0,
          fontSize: primitives.typographyFontSizeSm,
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
        statusLarge: {
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        trailing: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 0,
          gap: primitives.spacingXs,
        },
      }),
    [],
  );
};
