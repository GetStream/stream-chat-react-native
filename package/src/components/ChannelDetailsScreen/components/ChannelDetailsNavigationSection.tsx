import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChannelDetailsListItem } from './ChannelDetailsListItem';

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
    () => <ChevronRight height={20} stroke={semantics.textTertiary} width={20} />,
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
      <ChannelDetailsListItem
        Icon={Pin}
        label={t('Pinned Messages')}
        testID='channel-details-pinned-messages'
        trailing={chevron}
      />
      <ChannelDetailsListItem
        Icon={ImageGrid}
        label={t('Photos & Videos')}
        testID='channel-details-photos-and-videos'
        trailing={chevron}
      />
      <ChannelDetailsListItem
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
