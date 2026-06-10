import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import {
  ChannelDetailsActionItem,
  ChevronRight,
  FilePickerIcon,
  ImageGrid,
  Pin,
  useChannelDetailsContext,
  useTheme,
  useTranslationContext,
} from 'stream-chat-react-native';

import type { StackNavigatorParamList } from '../types';

/**
 * SampleApp implementation of the (now default-less) `ChannelDetailsNavigationSection`
 * slot. It wires the Pinned Messages / Photos & Videos / Files rows to the app's own
 * navigation screens. Registered via `useSampleAppComponentOverrides`.
 */
export const ChannelDetailsNavigationSection = () => {
  const { t } = useTranslationContext();
  const { channel } = useChannelDetailsContext();
  const navigation = useNavigation<NavigationProp<StackNavigatorParamList>>();
  const {
    theme: {
      channelDetails: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const chevron = useMemo(
    () => (
      <View>
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
        onPress={() => navigation.navigate('ChannelPinnedMessagesScreen', { channel })}
        testID='channel-details-pinned-messages'
        trailing={chevron}
      />
      <ChannelDetailsActionItem
        Icon={ImageGrid}
        label={t('Photos & Videos')}
        onPress={() => navigation.navigate('ChannelImagesScreen', { channel })}
        testID='channel-details-photos-and-videos'
        trailing={chevron}
      />
      <ChannelDetailsActionItem
        Icon={FilePickerIcon}
        label={t('Files')}
        onPress={() => navigation.navigate('ChannelFilesScreen', { channel })}
        testID='channel-details-files'
        trailing={chevron}
      />
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        sectionCard: {
          borderRadius: 16,
          overflow: 'hidden',
          paddingVertical: 4,
        },
      }),
    [],
  );
