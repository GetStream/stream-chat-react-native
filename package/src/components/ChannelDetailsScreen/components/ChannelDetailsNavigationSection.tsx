import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChannelDetailsActionItem } from './ChannelDetailsActionItem';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { ChevronRight } from '../../../icons';
import { File } from '../../../icons/file';
import { ImageGrid } from '../../../icons/gallery';
import { Pin } from '../../../icons/pin';
import { primitives } from '../../../theme';

export const ChannelDetailsNavigationSection = () => {
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const chevron = useMemo(
    () => (
      <View accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>
        <ChevronRight height={20} stroke={semantics.textTertiary} width={20} />
      </View>
    ),
    [semantics.textTertiary],
  );

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: semantics.backgroundCoreSurfaceCard },
        sectionCardOverride,
      ]}
    >
      <ChannelDetailsActionItem
        Icon={Pin}
        label={t('Pinned Messages')}
        testID='channel-details-pinned-messages'
        trailing={chevron}
      />
      <ChannelDetailsActionItem
        Icon={ImageGrid}
        label={t('Photos & Videos')}
        testID='channel-details-photos-and-videos'
        trailing={chevron}
      />
      <ChannelDetailsActionItem
        Icon={File}
        label={t('Files')}
        testID='channel-details-files'
        trailing={chevron}
      />
    </View>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        sectionCard: {
          borderRadius: primitives.radiusLg,
          overflow: 'hidden',
          paddingVertical: primitives.spacingXs,
        },
      }),
    [],
  );
};
