import React, { useCallback, useMemo, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { ChannelAllMembersModal } from './members/ChannelAllMembersModal';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import { useChannelDetailsMembersPreview } from '../hooks/useChannelDetailsMembersPreview';

export type ChannelDetailsMemberSectionProps = {
  /**
   * Fired when the user taps the "view all members" button. By default it opens the members bottom sheet.
   */
  onViewAllMembersPress?: () => void;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsMemberSection = ({
  onViewAllMembersPress,
}: ChannelDetailsMemberSectionProps) => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetails: {
        memberSection: {
          footer: footerOverride,
          header: headerOverride,
          headerTitle: headerTitleOverride,
          viewAllLabel: viewAllLabelOverride,
        },
        sectionCard: sectionCardOverride,
      },
      semantics,
    },
  } = useTheme();
  const { ChannelAddMembersButton, ChannelMemberActionsSheet, ChannelMemberItem } =
    useComponentsContext();
  const { hasMore, total, visible } = useChannelDetailsMembersPreview(channel);
  const styles = useStyles();
  const [isMemberListVisible, setMemberListVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse | null>(null);

  const handleViewAllPress = useCallback(() => {
    if (onViewAllMembersPress) {
      onViewAllMembersPress();
      return;
    }
    setMemberListVisible(true);
  }, [onViewAllMembersPress]);

  const handleMemberListClose = useCallback(() => setMemberListVisible(false), []);

  const handleMemberActionsClose = useCallback(() => setSelectedMember(null), []);

  const handleMemberPress = useCallback(
    (member: ChannelMemberResponse) => setSelectedMember(member),
    [],
  );

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: semantics.backgroundCoreSurfaceCard },
        sectionCardOverride,
      ]}
    >
      <View style={[styles.header, headerOverride]}>
        <Text
          accessibilityRole='header'
          style={[styles.headerTitle, { color: semantics.textPrimary }, headerTitleOverride]}
        >
          {t('{{count}} members', { count: total })}
        </Text>
        <ChannelAddMembersButton
          testID='channel-details-member-section-add-button'
          variant='text'
        />
      </View>
      <View style={styles.list}>
        {visible.map((member) => {
          if (!member.user?.id) return null;
          return (
            <ChannelMemberItem key={member.user.id} member={member} onPress={handleMemberPress} />
          );
        })}
      </View>
      {hasMore ? (
        <Pressable
          accessibilityLabel={t('View all')}
          accessibilityRole='button'
          onPress={handleViewAllPress}
          style={[styles.footer, { borderTopColor: semantics.borderCoreDefault }, footerOverride]}
        >
          <View style={styles.viewAllButton}>
            <Text
              style={[styles.viewAllLabel, { color: semantics.textPrimary }, viewAllLabelOverride]}
            >
              {t('View all')}
            </Text>
          </View>
        </Pressable>
      ) : null}
      <ChannelAllMembersModal onClose={handleMemberListClose} visible={isMemberListVisible} />
      {selectedMember ? (
        <ChannelMemberActionsSheet
          member={selectedMember}
          onClose={handleMemberActionsClose}
          visible
        />
      ) : null}
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        footer: {
          alignItems: 'center',
          borderTopWidth: 1,
          paddingHorizontal: primitives.spacingMd,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingSm,
          justifyContent: 'space-between',
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacingXs,
        },
        headerTitle: {
          flexShrink: 1,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        list: {
          paddingBottom: primitives.spacingSm,
        },
        sectionCard: {
          borderRadius: primitives.radiusLg,
          overflow: 'hidden',
        },
        viewAllButton: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          width: '100%',
        },
        viewAllLabel: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [],
  );
