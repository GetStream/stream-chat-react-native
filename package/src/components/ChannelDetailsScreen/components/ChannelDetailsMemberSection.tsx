import React, { useCallback, useMemo, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { ChannelAddMembersModal } from './members/ChannelAddMembersModal';
import { ChannelAllMembersModal } from './members/ChannelAllMembersModal';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelOwnCapabilities } from '../../../hooks/useChannelOwnCapabilities';
import { useMutedMemberIds } from '../../../hooks/useMutedMemberIds';
import { primitives } from '../../../theme';
import { Button } from '../../ui/Button/Button';
import { useChannelDetailsMembersPreview } from '../hooks/useChannelDetailsMembersPreview';

export const ChannelDetailsMemberSection = () => {
  const { channel, onAddMembersPress, onMemberPress, onViewAllMembersPress } =
    useChannelDetailsContext();
  const { t } = useTranslationContext();
  const ownCapabilities = useChannelOwnCapabilities(channel);
  const updateChannelMembers = ownCapabilities?.includes('update-channel-members') ?? false;
  const {
    theme: {
      channelDetailsScreen: {
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
  const { ChannelMemberActionsSheet, ChannelMemberItem } = useComponentsContext();
  const { hasMore, total, visible } = useChannelDetailsMembersPreview(channel);
  const mutedMemberIds = useMutedMemberIds(channel);
  const styles = useStyles();
  const [isMemberListVisible, setMemberListVisible] = useState(false);
  const [isAddMembersVisible, setAddMembersVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse | null>(null);

  const handleViewAllPress = useCallback(() => {
    if (onViewAllMembersPress) {
      onViewAllMembersPress();
      return;
    }
    setMemberListVisible(true);
  }, [onViewAllMembersPress]);

  const handleMemberListClose = useCallback(() => setMemberListVisible(false), []);

  const handleAddMembersClose = useCallback(() => setAddMembersVisible(false), []);

  const handleAddMembersPress = useCallback(() => {
    if (onAddMembersPress) {
      onAddMembersPress();
      return;
    }
    setMemberListVisible(false);
    setAddMembersVisible(true);
  }, [onAddMembersPress]);

  const handleMemberActionsClose = useCallback(() => setSelectedMember(null), []);

  const handleMemberPress = useCallback(
    (member: ChannelMemberResponse) => {
      if (onMemberPress) {
        onMemberPress(member);
        return;
      }
      setSelectedMember(member);
    },
    [onMemberPress],
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
        {updateChannelMembers ? (
          <View style={styles.headerAddButton}>
            <Button
              accessibilityLabelKey='a11y/Add members'
              label={t('Add')}
              onPress={handleAddMembersPress}
              size='sm'
              style={styles.headerAddButtonInner}
              testID='channel-details-member-section-add-button'
              type='outline'
              variant='secondary'
            />
          </View>
        ) : null}
      </View>
      <View style={styles.list}>
        {visible.map((member) => {
          if (!member.user?.id) return null;
          return (
            <ChannelMemberItem
              isMuted={mutedMemberIds.has(member.user.id)}
              key={member.user.id}
              member={member}
              onPress={() => handleMemberPress(member)}
            />
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
      <ChannelAllMembersModal
        onAddMembersPress={handleAddMembersPress}
        onClose={handleMemberListClose}
        visible={isMemberListVisible}
      />
      <ChannelAddMembersModal onClose={handleAddMembersClose} visible={isAddMembersVisible} />
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
        headerAddButton: {
          flexShrink: 0,
        },
        headerAddButtonInner: {
          width: 'auto',
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
