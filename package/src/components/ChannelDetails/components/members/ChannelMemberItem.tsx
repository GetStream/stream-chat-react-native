import React, { useMemo } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { composeAccessibilityLabel } from '../../../../a11y/a11yUtils';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../../theme';
import { useUserMuteActive } from '../../../Message/hooks/useUserMuteActive';
import { UserAvatar } from '../../../ui/Avatar/UserAvatar';
import { GetMemberRoles, useMemberRoles } from '../../hooks/members/useMemberRoles';
import { useUserActivityStatus } from '../../hooks/useUserActivityStatus';

export type ChannelMemberItemSize = 'sm' | 'lg';

export type ChannelMemberItemProps = {
  member: ChannelMemberResponse;
  /**
   * Overrides the roles shown next to the member. Receives
   * `{ channel, defaultRoleLabels, member, t }` and returns `{ key, label }` roles, or an empty
   * array for none. Defaults to the Owner, Admin and Moderator roles that apply.
   */
  getMemberRoles?: GetMemberRoles;
  onPress?: (member: ChannelMemberResponse) => void;
  /**
   * Size of the row. `'sm'` is the compact list row with a trailing role label. `'lg'` is a
   * profile-style header with a larger avatar and no role label. Defaults to `'sm'`.
   */
  size?: ChannelMemberItemSize;
  testID?: string;
};

export const ChannelMemberItem = ({
  getMemberRoles,
  member,
  onPress,
  size = 'sm',
  testID,
}: ChannelMemberItemProps) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { icons, RoleList } = useComponentsContext();
  const {
    theme: {
      channelDetails: {
        memberItem: { container: containerOverride, name: nameOverride, status: statusOverride },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();
  const statusLine = useUserActivityStatus(member.user);
  const roles = useMemberRoles(member, getMemberRoles);
  const isMuted = useUserMuteActive(member.user);

  const user = member.user;
  if (!user) return null;

  const isLarge = size === 'lg';
  const isCurrentUser = !!client?.userID && user.id === client.userID;
  const displayName = isCurrentUser ? t('common.you.label', 'You') : (user.name ?? user.id);
  const accessibilityLabel = composeAccessibilityLabel(
    displayName,
    roles.map((role) => role.label).join(', ') || undefined,
    isMuted ? t('channelDetails.muted.accessibilityLabel', 'Muted') : undefined,
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
      {isMuted || roles.length > 0 ? (
        <View style={styles.trailing}>
          {isMuted ? (
            <icons.Mute
              height={16}
              pathFill={semantics.textTertiary}
              testID='channel-member-muted-indicator'
              width={16}
            />
          ) : null}
          <RoleList roles={roles} />
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole='button'
        onPress={() => onPress(member)}
        style={({ pressed }) => [
          isLarge ? styles.containerLarge : styles.container,
          pressed
            ? {
                backgroundColor: semantics.backgroundUtilityPressed,
                borderRadius: primitives.radiusLg,
              }
            : null,
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
