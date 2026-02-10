import React from 'react';

import { Platform, PressableProps } from 'react-native';

import {
  useAttachmentPickerContext,
  useChannelContext,
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
} from '../../../icons';
import { Button, ButtonProps } from '../../ui';

export type AttachmentTypePickerButtonProps = Pick<ButtonProps, 'selected' | 'onPress'> & {
  Icon: ButtonProps['LeadingIcon'];
} & Pick<PressableProps, 'testID'>;

const hitSlop = { bottom: 15, top: 15 };

export const AttachmentTypePickerButton = ({
  testID,
  selected,
  onPress,
  Icon,
}: AttachmentTypePickerButtonProps) => {
  return (
    <Button
      testID={testID}
      hitSlop={hitSlop}
      onPress={onPress}
      LeadingIcon={Icon}
      type={'ghost'}
      size={'lg'}
      variant={'secondary'}
      iconOnly={true}
      selected={selected}
    />
  );
};

export const MediaPickerButton = () => {
  const { hasImagePicker } = useMessageInputContext();
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const setImagePicker = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker('images');
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
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const { hasCameraPicker } = useMessageInputContext();

  const onCameraPickerPress = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker('camera-photo');
  });

  const onVideoRecorderPickerPress = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker('camera-video');
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
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const { hasFilePicker, pickFile } = useMessageInputContext();

  const openFilePicker = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker('files');
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
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const { threadList } = useChannelContext();
  const { hasCreatePoll } = useMessagesContext();
  const ownCapabilities = useOwnCapabilitiesContext();

  const { openPollCreationDialog, sendMessage } = useMessageInputContext();

  const openPollCreationModal = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker('polls');
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
  const { hasCommands } = useMessageInputContext();
  const { attachmentPickerStore } = useAttachmentPickerContext();
  const { selectedPicker } = useAttachmentPickerState();

  const setCommandsPicker = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker('commands');
  });

  return hasCommands ? (
    <AttachmentTypePickerButton
      testID='commands-touchable'
      Icon={CommandsIcon}
      selected={selectedPicker === 'commands'}
      onPress={setCommandsPicker}
    />
  ) : null;
};
