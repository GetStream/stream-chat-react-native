import React, { useMemo, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { UserResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useOwnCapabilitiesContext } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../hooks/useChannelActions';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Checkmark } from '../../../icons/checkmark-1';
import { UserAdd } from '../../../icons/user-add';
import { NewClose } from '../../../icons/xmark';
import { primitives } from '../../../theme';
import { NotificationList } from '../../Notifications/NotificationList';
import { NotificationTargetProvider } from '../../Notifications/NotificationTargetContext';
import { Button } from '../../ui/Button/Button';
import { BottomSheetModal } from '../../UIComponents/BottomSheetModal';
import { useChannelDetailsMembersPreview } from '../hooks/useChannelDetailsMembersPreview';

export const ChannelDetailsMemberSection = () => {
  const { channel, onAddMembersPress, onViewAllMembersPress } = useChannelDetailsContext();
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { addMembers } = useChannelActions(channel);
  const { updateChannelMembers } = useOwnCapabilitiesContext();
  const { height: windowHeight } = useWindowDimensions();
  const addMembersNotificationHostId = channel?.cid
    ? `channel-add-members:${channel.cid}`
    : undefined;
  const {
    theme: {
      channelDetailsScreen: {
        memberSection: {
          confirmButton: confirmButtonOverride,
          footer: footerOverride,
          header: headerOverride,
          headerTitle: headerTitleOverride,
          modalHeader: modalHeaderOverride,
          modalHeaderTitle: modalHeaderTitleOverride,
          viewAllLabel: viewAllLabelOverride,
        },
        sectionCard: sectionCardOverride,
      },
      semantics,
    },
  } = useTheme();
  const { ChannelAddMembers, ChannelDetailsMemberList, ChannelDetailsMemberListItem } =
    useComponentsContext();
  const { hasMore, total, visible } = useChannelDetailsMembersPreview(channel);
  const styles = useStyles();
  const [isMemberListVisible, setMemberListVisible] = useState(false);
  const [isAddMembersVisible, setAddMembersVisible] = useState(false);
  const [addMembersSelection, setAddMembersSelection] = useState<UserResponse[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  const handleViewAllPress = useStableCallback(() => {
    if (onViewAllMembersPress) {
      onViewAllMembersPress();
      return;
    }
    setMemberListVisible(true);
  });

  const handleMemberListClose = useStableCallback(() => setMemberListVisible(false));

  const handleAddMembersClose = useStableCallback(() => {
    setAddMembersVisible(false);
    setAddMembersSelection([]);
  });

  const handleAddMembersSelectionChange = useStableCallback((users: UserResponse[]) => {
    setAddMembersSelection(users);
  });

  const handleAddMembersConfirm = useStableCallback(async () => {
    if (!addMembersSelection.length || addingMembers) return;
    setAddingMembers(true);
    try {
      await addMembers(
        addMembersSelection.map((u) => u.id),
        {
          onSuccess: () => {
            setAddMembersVisible(false);
            setAddMembersSelection([]);
          },
        },
      );
    } finally {
      setAddingMembers(false);
    }
  });

  const handleAddMembersPress = useStableCallback(() => {
    if (onAddMembersPress) {
      onAddMembersPress();
      return;
    }
    setMemberListVisible(false);
    setAddMembersSelection([]);
    setAddMembersVisible(true);
  });

  const confirmEnabled = addMembersSelection.length > 0 && !addingMembers;

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
            <ChannelDetailsMemberListItem
              isCurrentUser={member.user.id === client.userID}
              key={member.user.id}
              member={member}
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
      <BottomSheetModal
        height={windowHeight}
        onClose={handleMemberListClose}
        visible={isMemberListVisible}
      >
        <View style={[styles.modalHeader, modalHeaderOverride]}>
          <View style={styles.modalHeaderSide}>
            <Button
              accessibilityLabelKey='a11y/Close'
              iconOnly
              LeadingIcon={NewClose}
              onPress={handleMemberListClose}
              size='md'
              type='outline'
              variant='secondary'
            />
          </View>
          <View style={styles.modalHeaderCenter}>
            <Text
              accessibilityRole='header'
              numberOfLines={1}
              style={[
                styles.modalHeaderTitle,
                { color: semantics.textPrimary },
                modalHeaderTitleOverride,
              ]}
            >
              {t('{{count}} members', { count: total })}
            </Text>
          </View>
          <View style={[styles.modalHeaderSide, styles.modalHeaderSideRight]}>
            {updateChannelMembers ? (
              <Button
                accessibilityLabelKey='a11y/Add members'
                iconOnly
                LeadingIcon={UserAdd}
                onPress={handleAddMembersPress}
                size='md'
                testID='channel-details-member-list-add-button'
                type='outline'
                variant='secondary'
              />
            ) : null}
          </View>
        </View>
        <ChannelDetailsMemberList />
      </BottomSheetModal>
      <BottomSheetModal
        height={windowHeight}
        onClose={handleAddMembersClose}
        visible={isAddMembersVisible}
      >
        {addMembersNotificationHostId ? (
          <NotificationTargetProvider hostId={addMembersNotificationHostId} panel='channel-details'>
            <View style={styles.modalBody}>
              <View style={[styles.modalHeader, modalHeaderOverride]}>
                <View style={styles.modalHeaderSide}>
                  <Button
                    accessibilityLabelKey='a11y/Close'
                    iconOnly
                    LeadingIcon={NewClose}
                    onPress={handleAddMembersClose}
                    size='md'
                    type='outline'
                    variant='secondary'
                  />
                </View>
                <View style={styles.modalHeaderCenter}>
                  <Text
                    accessibilityRole='header'
                    numberOfLines={1}
                    style={[
                      styles.modalHeaderTitle,
                      { color: semantics.textPrimary },
                      modalHeaderTitleOverride,
                    ]}
                  >
                    {t('Add Members')}
                  </Text>
                </View>
                <View style={[styles.modalHeaderSide, styles.modalHeaderSideRight]}>
                  <Pressable
                    accessibilityLabel={t('a11y/Confirm add members')}
                    accessibilityRole='button'
                    accessibilityState={{ disabled: !confirmEnabled }}
                    disabled={!confirmEnabled}
                    onPress={handleAddMembersConfirm}
                    style={[
                      styles.confirmButton,
                      confirmEnabled
                        ? { backgroundColor: semantics.accentPrimary }
                        : {
                            borderColor: semantics.borderCoreDefault,
                            borderWidth: 1,
                          },
                      confirmButtonOverride,
                    ]}
                    testID='channel-details-add-members-confirm-button'
                  >
                    <Checkmark
                      height={20}
                      pathFill={confirmEnabled ? semantics.textOnInverse : semantics.textSecondary}
                      width={20}
                    />
                  </Pressable>
                </View>
              </View>
              <ChannelAddMembers onSelectionChange={handleAddMembersSelectionChange} />
              <NotificationList />
            </View>
          </NotificationTargetProvider>
        ) : null}
      </BottomSheetModal>
    </View>
  );
};

const useStyles = () => {
  return useMemo(
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
        modalBody: {
          flex: 1,
        },
        modalHeader: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingBottom: primitives.spacingXs,
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacingXs,
        },
        modalHeaderCenter: {
          alignItems: 'center',
          flex: 2,
          justifyContent: 'center',
        },
        modalHeaderSide: {
          flex: 1,
          justifyContent: 'center',
        },
        modalHeaderSideRight: {
          alignItems: 'flex-end',
        },
        modalHeaderTitle: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          textTransform: 'capitalize',
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        confirmButton: {
          alignItems: 'center',
          borderRadius: 9999,
          height: 40,
          justifyContent: 'center',
          width: 40,
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
};
