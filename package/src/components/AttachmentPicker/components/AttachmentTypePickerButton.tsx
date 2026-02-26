import React, { useCallback, useState } from 'react';

import { Platform } from 'react-native';

import { PressableProps } from 'react-native-gesture-handler';

import { AttachmentCommandPicker } from './AttachmentPickerContent';

import {
  useAttachmentPickerContext,
  useChannelContext,
  useMessageComposer,
  useMessageInputContext,
  useMessagesContext,
  useOwnCapabilitiesContext,
} from '../../../contexts';
import { useStableCallback } from '../../../hooks';
import { useAttachmentPickerState } from '../../../hooks/useAttachmentPickerState';
import {
  Camera,
  Picture,
  Recorder,
  FilePickerIcon,
  PollThumbnail,
  CommandsIcon,
  IconProps,
} from '../../../icons';
import { Button, ButtonProps } from '../../ui';
import { BottomSheetModal } from '../../UIComponents';

export type AttachmentTypePickerButtonProps = Pick<ButtonProps, 'selected' | 'onPress'> & {
  Icon: ButtonProps['LeadingIcon'];
} & Pick<PressableProps, 'testID'>;

const hitSlop = { bottom: 15, top: 15 };

export const AttachmentTypePickerButton = ({
  testID,
  selected,
  onPress: onPressProp,
  Icon,
}: AttachmentTypePickerButtonProps) => {
  const { disableAttachmentPicker } = useAttachmentPickerContext();
  const ButtonIcon = useCallback(
    (props: IconProps) => Icon && <Icon {...props} width={14} height={14} />,
    [Icon],
  );

  const onPress = useStableCallback((event) =>
    // @ts-expect-error FIXME: RNGH does not seem to expose PressableEvent
    (!selected || disableAttachmentPicker) && onPressProp ? onPressProp(event) : null,
  );

  return (
    <Button
      testID={testID}
      hitSlop={hitSlop}
      onPress={onPress}
      LeadingIcon={ButtonIcon}
      type={'ghost'}
      size={'lg'}
      variant={'secondary'}
      iconOnly={true}
      selected={selected && !disableAttachmentPicker}
    />
  );
};

export const MediaPickerButton = () => {
  const { hasImagePicker, pickAndUploadImageFromNativePicker } = useMessageInputContext();
  const { attachmentPickerStore, disableAttachmentPicker } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const setImagePicker = useStableCallback(() => {
    if (disableAttachmentPicker) {
      pickAndUploadImageFromNativePicker();
    } else {
      attachmentPickerStore.setSelectedPicker('images');
    }
  });

  return hasImagePicker ? (
    <AttachmentTypePickerButton
      testID='upload-photo-touchable'
      Icon={Picture}
      selected={selectedPicker === 'images'}
      onPress={setImagePicker}
    />
  ) : null;
};

export const CameraPickerButton = () => {
  const { attachmentPickerStore, disableAttachmentPicker } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const { hasCameraPicker, takeAndUploadImage } = useMessageInputContext();

  const onCameraPickerPress = useStableCallback(() => {
    if (disableAttachmentPicker) {
      takeAndUploadImage(Platform.OS === 'android' ? 'image' : 'mixed');
    } else {
      attachmentPickerStore.setSelectedPicker('camera-photo');
    }
  });

  const onVideoRecorderPickerPress = useStableCallback(() => {
    if (disableAttachmentPicker) {
      takeAndUploadImage('video');
    } else {
      attachmentPickerStore.setSelectedPicker('camera-video');
    }
  });

  return hasCameraPicker ? (
    <>
      <AttachmentTypePickerButton
        testID='take-photo-touchable'
        Icon={Camera}
        selected={selectedPicker === 'camera-photo'}
        onPress={onCameraPickerPress}
      />
      {Platform.OS === 'android' ? (
        <AttachmentTypePickerButton
          Icon={Recorder}
          selected={selectedPicker === 'camera-video'}
          onPress={onVideoRecorderPickerPress}
        />
      ) : null}
    </>
  ) : null;
};

export const FilePickerButton = () => {
  const { attachmentPickerStore, disableAttachmentPicker } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const { hasFilePicker, pickFile } = useMessageInputContext();

  const openFilePicker = useStableCallback(() => {
    if (!disableAttachmentPicker) {
      attachmentPickerStore.setSelectedPicker('files');
    }
    pickFile();
  });

  return hasFilePicker ? (
    <AttachmentTypePickerButton
      testID='upload-file-touchable'
      Icon={FilePickerIcon}
      selected={selectedPicker === 'files'}
      onPress={openFilePicker}
    />
  ) : null;
};

export const PollPickerButton = () => {
  const { attachmentPickerStore, disableAttachmentPicker } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const { threadList } = useChannelContext();
  const { hasCreatePoll } = useMessagesContext();
  const ownCapabilities = useOwnCapabilitiesContext();

  const { openPollCreationDialog, sendMessage } = useMessageInputContext();

  const openPollCreationModal = useStableCallback(() => {
    if (!disableAttachmentPicker) {
      attachmentPickerStore.setSelectedPicker('polls');
    }
    openPollCreationDialog?.({ sendMessage });
  });

  return !threadList && hasCreatePoll && ownCapabilities.sendPoll ? ( // do not allow poll creation in threads
    <AttachmentTypePickerButton
      testID='create-poll-touchable'
      Icon={PollThumbnail}
      selected={selectedPicker === 'polls'}
      onPress={openPollCreationModal}
    />
  ) : null;
};

export const CommandsPickerButton = () => {
  const [showCommandsSheet, setShowCommandsSheet] = useState(false);
  const messageComposer = useMessageComposer();
  const { hasCommands } = useMessageInputContext();
  const { attachmentPickerStore, disableAttachmentPicker } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const setCommandsPicker = useStableCallback(() => {
    if (disableAttachmentPicker) {
      setShowCommandsSheet(true);
    } else {
      attachmentPickerStore.setSelectedPicker('commands');
    }
  });

  const onClose = useStableCallback(() => setShowCommandsSheet(false));

  return hasCommands && !messageComposer.editedMessage ? (
    <>
      <AttachmentTypePickerButton
        testID='commands-touchable'
        Icon={CommandsIcon}
        selected={selectedPicker === 'commands'}
        onPress={setCommandsPicker}
      />
      {showCommandsSheet ? (
        <BottomSheetModal height={338} onClose={onClose} visible={showCommandsSheet} lazy={true}>
          <AttachmentCommandPicker />
        </BottomSheetModal>
      ) : null}
    </>
  ) : null;
};
