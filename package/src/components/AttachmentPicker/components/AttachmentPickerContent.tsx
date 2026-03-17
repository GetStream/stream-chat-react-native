import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';

import { CommandSearchSource, CommandSuggestion } from 'stream-chat';

import { AttachmentMediaPicker } from './AttachmentMediaPicker/AttachmentMediaPicker';

import {
  useAttachmentPickerContext,
  useBottomSheetContext,
  useMessageComposer,
  useMessageInputContext,
  useTranslationContext,
} from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useAttachmentPickerState, useStableCallback } from '../../../hooks';
import { Camera, FilePickerIcon, IconProps, PollThumbnail, Recorder } from '../../../icons';
import { primitives } from '../../../theme';
import { CommandSuggestionItem } from '../../AutoCompleteInput/AutoCompleteSuggestionItem';
import { Button } from '../../ui';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: semantics.backgroundCoreElevation1,
          paddingHorizontal: primitives.spacing2xl,
          paddingBottom: primitives.spacing3xl,
        },
        infoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        text: {
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textSecondary,
          marginTop: 8,
          marginHorizontal: 24,
          textAlign: 'center',
          maxWidth: 200,
        },
      }),
    [semantics.backgroundCoreElevation1, semantics.textSecondary],
  );
};

export type AttachmentPickerGenericContentProps = {
  Icon: React.ComponentType<IconProps>;
  onPress: () => void;
  height?: number;
  buttonText?: string;
  description?: string;
};

export const AttachmentPickerGenericContent = (props: AttachmentPickerGenericContentProps) => {
  const { height, buttonText, Icon, description, onPress } = props;
  const styles = useStyles();

  const {
    theme: {
      semantics,
      attachmentPicker: {
        content: { container, text, infoContainer },
      },
    },
  } = useTheme();

  const ThemedIcon = useCallback(
    () => <Icon width={22} height={22} stroke={semantics.textTertiary} />,
    [Icon, semantics.textTertiary],
  );

  return (
    <View
      style={[
        styles.container,
        {
          height,
        },
        container,
      ]}
    >
      <View style={[styles.infoContainer, infoContainer]}>
        <ThemedIcon />
        <Text style={[styles.text, text]}>{description}</Text>
      </View>
      <Button
        variant={'secondary'}
        type={'outline'}
        size={'lg'}
        label={buttonText}
        onPress={onPress}
      />
    </View>
  );
};

const keyExtractor = (item: { id: string }) => item.id;

const AttachmentCommandPickerItemUI = ({
  item,
  onPress,
}: {
  item: CommandSuggestion;
  onPress: () => void;
}) => {
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => ({
        backgroundColor: pressed ? semantics.backgroundUtilityPressed : undefined,
        borderRadius: primitives.radiusSm,
      })}
      onPress={onPress}
    >
      <CommandSuggestionItem {...item} />
    </Pressable>
  );
};

export const AttachmentCommandNativePickerItem = ({ item }: { item: CommandSuggestion }) => {
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { inputBoxRef } = useMessageInputContext();
  const { close } = useBottomSheetContext();

  const handlePress = useCallback(() => {
    textComposer.setCommand(item);
    close(() => inputBoxRef.current?.focus());
  }, [textComposer, item, close, inputBoxRef]);

  return <AttachmentCommandPickerItemUI item={item} onPress={handlePress} />;
};

export const AttachmentCommandPickerItem = ({ item }: { item: CommandSuggestion }) => {
  const { disableAttachmentPicker } = useAttachmentPickerContext();

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { inputBoxRef } = useMessageInputContext();

  const handlePress = useCallback(() => {
    textComposer.setCommand(item);
    inputBoxRef.current?.focus();
  }, [textComposer, item, inputBoxRef]);

  if (disableAttachmentPicker) {
    return <AttachmentCommandNativePickerItem item={item} />;
  }

  return <AttachmentCommandPickerItemUI item={item} onPress={handlePress} />;
};

const renderItem = ({ item }: { item: CommandSuggestion }) => {
  return <AttachmentCommandPickerItem item={item} />;
};

const useCommandPickerStyle = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        contentContainer: {
          flexGrow: 1,
          paddingHorizontal: primitives.spacingXxs,
          paddingBottom: primitives.spacing2xl,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
        title: {
          backgroundColor: semantics.backgroundCoreElevation1,
          fontWeight: primitives.typographyFontWeightSemiBold,
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textPrimary,
          paddingHorizontal: primitives.spacingMd,
          paddingBottom: primitives.spacingMd,
        },
      }),
    [semantics.backgroundCoreElevation1, semantics.textPrimary],
  );
};

export const AttachmentCommandPicker = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const [commands] = useState(() => {
    const commandsSearchSource = new CommandSearchSource(messageComposer.channel);
    const result = commandsSearchSource.query('');

    return result.items;
  });
  const styles = useCommandPickerStyle();

  return (
    <>
      <Text style={styles.title}>{t('Instant Commands')}</Text>
      <FlatList
        contentContainerStyle={styles.contentContainer}
        renderItem={renderItem}
        data={commands}
        keyExtractor={keyExtractor}
      />
    </>
  );
};

export const AttachmentPollPicker = (props: AttachmentPickerContentProps) => {
  const { t } = useTranslationContext();
  const { height } = props;
  const { openPollCreationDialog, sendMessage } = useMessageInputContext();

  const openPollCreationModal = useStableCallback(() => {
    openPollCreationDialog?.({ sendMessage });
  });

  return (
    <AttachmentPickerGenericContent
      Icon={PollThumbnail}
      onPress={openPollCreationModal}
      height={height}
      buttonText={t('Create Poll')}
      description={t('Create a poll and let everyone vote')}
    />
  );
};

export const AttachmentCameraPicker = (
  props: AttachmentPickerContentProps & { videoOnly?: boolean },
) => {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const { t } = useTranslationContext();
  const { height, videoOnly } = props;
  const { takeAndUploadImage } = useMessageInputContext();

  const openCameraPicker = useStableCallback(async () => {
    const result = await takeAndUploadImage(
      videoOnly ? 'video' : Platform.OS === 'android' ? 'image' : 'mixed',
    );
    if (result?.askToOpenSettings) {
      setPermissionDenied(true);
    }
  });

  const openSettings = useStableCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.log(error);
    }
  });

  useEffect(() => {
    openCameraPicker();
  }, [openCameraPicker]);

  return permissionDenied ? (
    <AttachmentPickerGenericContent
      Icon={Camera}
      onPress={openSettings}
      height={height}
      buttonText={t('Change in Settings')}
      description={t('You have not granted access to your camera')}
    />
  ) : (
    <AttachmentPickerGenericContent
      Icon={videoOnly ? Recorder : Camera}
      onPress={openCameraPicker}
      height={height}
      buttonText={t('Open Camera')}
      description={t('Take a video and share')}
    />
  );
};

export const AttachmentFilePicker = (props: AttachmentPickerContentProps) => {
  const { t } = useTranslationContext();
  const { height } = props;
  const { pickFile } = useMessageInputContext();

  return (
    <AttachmentPickerGenericContent
      Icon={FilePickerIcon}
      onPress={pickFile}
      height={height}
      buttonText={t('Pick document')}
      description={t('Pick a document to share it with everyone')}
    />
  );
};

export type AttachmentPickerContentProps = Pick<AttachmentPickerGenericContentProps, 'height'>;

export const AttachmentPickerContent = (props: AttachmentPickerContentProps) => {
  const { height } = props;
  const { selectedPicker } = useAttachmentPickerState();

  // TODO V9: Think of a better way to do this. This is just a temporary fix.
  const lastSelectedPickerRef = useRef(selectedPicker);
  if (selectedPicker) {
    lastSelectedPickerRef.current = selectedPicker;
  }

  if (lastSelectedPickerRef.current === 'images') {
    return <AttachmentMediaPicker height={height} />;
  }

  if (lastSelectedPickerRef.current === 'files') {
    return <AttachmentFilePicker height={height} />;
  }

  if (lastSelectedPickerRef.current === 'camera-photo') {
    return <AttachmentCameraPicker height={height} />;
  }

  if (lastSelectedPickerRef.current === 'camera-video') {
    return <AttachmentCameraPicker height={height} videoOnly />;
  }

  if (lastSelectedPickerRef.current === 'polls') {
    return <AttachmentPollPicker height={height} />;
  }

  if (lastSelectedPickerRef.current === 'commands') {
    return <AttachmentCommandPicker />;
  }

  return null;
};
