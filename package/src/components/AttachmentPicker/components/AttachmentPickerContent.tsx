import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text } from 'react-native';

import { FlatList } from 'react-native-gesture-handler';

import { CommandSearchSource, CommandSuggestion, notifyCommandDisabled } from 'stream-chat';

import { AttachmentMediaPicker } from './AttachmentMediaPicker/AttachmentMediaPicker';

import {
  AttachmentPickerGenericContent,
  type AttachmentPickerContentProps,
} from './AttachmentPickerGenericContent';

import {
  useAttachmentPickerContext,
  useBottomSheetContext,
  useMessageComposer,
  useMessageInputContext,
  useTranslationContext,
} from '../../../contexts';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useAttachmentPickerState, useStableCallback } from '../../../hooks';
import { primitives } from '../../../theme';
import { CommandSuggestionItem } from '../../AutoCompleteInput/AutoCompleteSuggestionItem';

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
    if (notifyCommandDisabled(messageComposer, item)) {
      return;
    }

    textComposer.setCommand(item);
    close(() => inputBoxRef.current?.focus());
  }, [messageComposer, item, textComposer, close, inputBoxRef]);

  return <AttachmentCommandPickerItemUI item={item} onPress={handlePress} />;
};

export const AttachmentCommandPickerItem = ({ item }: { item: CommandSuggestion }) => {
  const { disableAttachmentPicker } = useAttachmentPickerContext();

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { inputBoxRef } = useMessageInputContext();

  const handlePress = useCallback(() => {
    if (notifyCommandDisabled(messageComposer, item)) {
      return;
    }

    textComposer.setCommand(item);
    inputBoxRef.current?.focus();
  }, [messageComposer, item, textComposer, inputBoxRef]);

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
      <Text style={styles.title}>{t('attachmentPicker.commands.title', 'Instant Commands')}</Text>
      <FlatList
        contentContainerStyle={styles.contentContainer}
        renderItem={renderItem}
        data={commands}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
      />
    </>
  );
};

export const AttachmentPollPicker = (props: AttachmentPickerContentProps) => {
  const { t } = useTranslationContext();
  const { icons } = useComponentsContext();
  const { height } = props;
  const { openPollCreationDialog, sendMessage } = useMessageInputContext();

  const openPollCreationModal = useStableCallback(() => {
    openPollCreationDialog?.({ sendMessage });
  });

  return (
    <AttachmentPickerGenericContent
      Icon={icons.PollThumbnail}
      onPress={openPollCreationModal}
      height={height}
      buttonText={t('attachmentPicker.poll.label', 'Create Poll')}
      description={t('attachmentPicker.poll.description', 'Create a poll and let everyone vote')}
    />
  );
};

export const AttachmentCameraPicker = (
  props: AttachmentPickerContentProps & { videoOnly?: boolean },
) => {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const { t } = useTranslationContext();
  const { icons } = useComponentsContext();
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
      Icon={icons.Camera}
      onPress={openSettings}
      height={height}
      buttonText={t('attachmentPicker.openSettings.label', 'Change in Settings')}
      description={t(
        'attachmentPicker.camera.denied.description',
        'You have not granted access to your camera',
      )}
    />
  ) : (
    <AttachmentPickerGenericContent
      Icon={videoOnly ? icons.VideoIcon : icons.Camera}
      onPress={openCameraPicker}
      height={height}
      buttonText={t('attachmentPicker.camera.label', 'Open Camera')}
      description={
        videoOnly
          ? t('attachmentPicker.camera.videoOnly.description', 'Take a video and share')
          : t('attachmentPicker.camera.description', 'Take a photo and share')
      }
    />
  );
};

export const AttachmentFilePicker = (props: AttachmentPickerContentProps) => {
  const { t } = useTranslationContext();
  const { icons } = useComponentsContext();
  const { height } = props;
  const { pickFile } = useMessageInputContext();

  return (
    <AttachmentPickerGenericContent
      Icon={icons.FilePickerIcon}
      onPress={pickFile}
      height={height}
      buttonText={t('attachmentPicker.files.label', 'Open Files')}
      description={t('attachmentPicker.files.description', 'Select files to share')}
    />
  );
};

export type { AttachmentPickerContentProps } from './AttachmentPickerGenericContent';
export { AttachmentPickerGenericContent } from './AttachmentPickerGenericContent';

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
