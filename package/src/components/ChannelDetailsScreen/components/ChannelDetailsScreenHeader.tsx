import React, { useCallback, useMemo, useState } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChannelEditDetailsModal } from './ChannelEditDetailsModal';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useChannelOwnCapabilities } from '../../../hooks/useChannelOwnCapabilities';
import { useIsDirectChat } from '../../../hooks/useIsDirectChat';
import { ChevronLeft } from '../../../icons/chevron-left';
import { primitives } from '../../../theme';
import { Button } from '../../ui/Button/Button';

export type ChannelDetailsScreenHeaderProps = {
  /** Override the auto-resolved screen title (1:1 → "Contact Info", group → "Group Info"). */
  title?: string;
};

export const ChannelDetailsScreenHeader = ({ title }: ChannelDetailsScreenHeaderProps) => {
  const { channel, onBack, onEditChannelPress } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const ownCapabilities = useChannelOwnCapabilities(channel);
  const canUpdateChannel = ownCapabilities?.includes('update-channel') ?? false;
  const {
    theme: {
      channelDetailsScreen: {
        header: { container: containerOverride, title: titleOverride },
      },
      semantics,
    },
  } = useTheme();
  const isDirect = useIsDirectChat(channel);
  const styles = useStyles();
  const [editModalVisible, setEditModalVisible] = useState(false);

  const resolvedTitle = title ?? (isDirect ? t('Contact Info') : t('Group Info'));

  const handleEditPress = useCallback(() => {
    if (onEditChannelPress) {
      onEditChannelPress();
      return;
    }
    setEditModalVisible(true);
  }, [onEditChannelPress]);

  const handleEditModalClose = useCallback(() => setEditModalVisible(false), []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: semantics.backgroundCoreElevation1 },
        containerOverride,
      ]}
    >
      <View style={styles.sideContainer}>
        {onBack ? (
          <Button
            accessibilityLabelKey='a11y/Back'
            iconOnly
            LeadingIcon={ChevronLeft}
            onPress={onBack}
            size='md'
            testID='channel-details-back-button'
            type='ghost'
            variant='secondary'
          />
        ) : null}
      </View>
      <View style={styles.centerContainer}>
        <Text
          accessibilityRole='header'
          numberOfLines={1}
          style={[styles.title, { color: semantics.textPrimary }, titleOverride]}
        >
          {resolvedTitle}
        </Text>
      </View>
      <View style={[styles.sideContainer, styles.sideContainerRight]}>
        {canUpdateChannel && !isDirect ? (
          <Button
            accessibilityLabelKey='a11y/Edit channel'
            label={t('Edit')}
            onPress={handleEditPress}
            size='sm'
            testID='channel-details-edit-button'
            type='outline'
            variant='secondary'
          />
        ) : null}
      </View>
      <ChannelEditDetailsModal onClose={handleEditModalClose} visible={editModalVisible} />
    </View>
  );
};

const useStyles = () => {
  const insets = useSafeAreaInsets();

  return useMemo(
    () =>
      StyleSheet.create({
        centerContainer: {
          alignItems: 'center',
          flex: 2,
          justifyContent: 'center',
        },
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingTop: insets.top + primitives.spacingSm,
          paddingBottom: primitives.spacingSm,
          paddingHorizontal: primitives.spacingSm,
          gap: primitives.spacingXs,
        },
        sideContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        sideContainerRight: {
          alignItems: 'flex-end',
        },
        title: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
      }),
    [insets.top],
  );
};
