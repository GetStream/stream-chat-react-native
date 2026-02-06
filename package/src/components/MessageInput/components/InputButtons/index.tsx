import React from 'react';
import { StyleSheet } from 'react-native';

import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { OwnCapabilitiesContextValue } from '../../../../contexts';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../../../contexts/messageInputContext/MessageInputContext';
import { useOwnCapabilitiesContext } from '../../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

export type InputButtonsProps = Partial<InputButtonsWithContextProps>;

export type InputButtonsWithContextProps = Pick<
  MessageInputContextValue,
  | 'AttachButton'
  | 'hasCameraPicker'
  | 'hasCommands'
  | 'hasFilePicker'
  | 'hasImagePicker'
  | 'toggleAttachmentPicker'
> &
  Pick<OwnCapabilitiesContextValue, 'uploadFile'>;

export const InputButtonsWithContext = (props: InputButtonsWithContextProps) => {
  const {
    AttachButton,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    uploadFile: ownCapabilitiesUploadFile,
  } = props;

  const {
    theme: {
      messageInput: { attachButtonContainer },
    },
  } = useTheme();

  const hasAttachmentUploadCapabilities =
    (hasCameraPicker || hasFilePicker || hasImagePicker) && ownCapabilitiesUploadFile;

  if (!hasAttachmentUploadCapabilities && !hasCommands) {
    return null;
  }

  return hasAttachmentUploadCapabilities ? (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={ZoomOut.duration(200)}
      style={[styles.attachButtonContainer, attachButtonContainer]}
    >
      <AttachButton />
    </Animated.View>
  ) : null;
};

const areEqual = (
  prevProps: InputButtonsWithContextProps,
  nextProps: InputButtonsWithContextProps,
) => {
  const {
    hasCameraPicker: prevHasCameraPicker,
    hasFilePicker: prevHasFilePicker,
    hasImagePicker: prevHasImagePicker,
  } = prevProps;

  const {
    hasCameraPicker: nextHasCameraPicker,
    hasFilePicker: nextHasFilePicker,
    hasImagePicker: nextHasImagePicker,
  } = nextProps;

  if (prevHasCameraPicker !== nextHasCameraPicker) {
    return false;
  }

  if (prevHasImagePicker !== nextHasImagePicker) {
    return false;
  }

  if (prevHasFilePicker !== nextHasFilePicker) {
    return false;
  }

  return true;
};

const MemoizedInputButtonsWithContext = React.memo(
  InputButtonsWithContext,
  areEqual,
) as typeof InputButtonsWithContext;

export const InputButtons = (props: InputButtonsProps) => {
  const {
    AttachButton,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    toggleAttachmentPicker,
  } = useMessageInputContext();
  const { uploadFile } = useOwnCapabilitiesContext();

  return (
    <MemoizedInputButtonsWithContext
      {...{
        AttachButton,
        hasCameraPicker,
        hasCommands,
        hasFilePicker,
        hasImagePicker,
        toggleAttachmentPicker,
        uploadFile,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  attachButtonContainer: {},
});
