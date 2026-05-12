import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { ChevronLeft } from '../../../icons/chevron-left';
import { primitives } from '../../../theme';
import { useIsDirectChat } from '../../ChannelList/hooks/useIsDirectChat';
import { Button } from '../../ui/Button/Button';

export type ChannelDetailsScreenHeaderProps = {
  /** Override the auto-resolved screen title (1:1 → "Contact Info", group → "Group Info"). */
  title?: string;
};

export const ChannelDetailsScreenHeader = ({ title }: ChannelDetailsScreenHeaderProps) => {
  const { channel, onBack } = useChannelDetailsContext();
  const { t } = useTranslationContext();
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

  const resolvedTitle = title ?? (isDirect ? t('Contact Info') : t('Group Info'));

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
      <View style={[styles.sideContainer, styles.sideContainerRight]} />
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
          paddingVertical: primitives.spacingSm,
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
        },
      }),
    [insets.top],
  );
};
