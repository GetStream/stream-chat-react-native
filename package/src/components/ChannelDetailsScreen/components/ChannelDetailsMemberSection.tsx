import React, { useMemo } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import { useChannelDetailsCreatorId } from '../hooks/useChannelDetailsCreatorId';
import { useChannelDetailsMembersPreview } from '../hooks/useChannelDetailsMembersPreview';

export const ChannelDetailsMemberSection = () => {
  const { channel } = useChannelDetailsContext();
  const { client } = useChatContext();
  const { t } = useTranslationContext();
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
  const { ChannelDetailsMemberListItem } = useComponentsContext();
  const { hasMore, total, visible } = useChannelDetailsMembersPreview(channel);
  const creatorId = useChannelDetailsCreatorId(channel);
  const styles = useStyles();

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: semantics.backgroundCoreSurfaceCard },
        sectionCardOverride,
      ]}
    >
      <View style={[styles.header, headerOverride]}>
        <Text style={[styles.headerTitle, { color: semantics.textPrimary }, headerTitleOverride]}>
          {t('{{count}} members', { count: total })}
        </Text>
      </View>
      <View style={styles.list}>
        {visible.map((member) => {
          if (!member.user?.id) return null;
          return (
            <ChannelDetailsMemberListItem
              isCurrentUser={member.user.id === client.userID}
              isOwner={creatorId === member.user.id}
              key={member.user.id}
              member={member}
            />
          );
        })}
      </View>
      {hasMore ? (
        <View
          style={[styles.footer, { borderTopColor: semantics.borderCoreDefault }, footerOverride]}
        >
          <Pressable accessibilityRole='button' style={styles.viewAllButton}>
            <Text
              style={[styles.viewAllLabel, { color: semantics.textPrimary }, viewAllLabelOverride]}
            >
              {t('View all')}
            </Text>
          </Pressable>
        </View>
      ) : null}
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
          justifyContent: 'space-between',
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacingXs,
        },
        headerTitle: {
          flex: 1,
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
};
