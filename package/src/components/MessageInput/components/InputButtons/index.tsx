import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AttachmentPickerContextValue,
  OwnCapabilitiesContextValue,
  useAttachmentPickerContext,
} from '../../../../contexts';
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
  Pick<AttachmentPickerContextValue, 'selectedPicker'> &
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
    <View style={[hasCommands ? styles.attachButtonContainer : undefined, attachButtonContainer]}>
      <AttachButton />
    </View>
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
    selectedPicker: prevSelectedPicker,
  } = prevProps;

  const {
    hasCameraPicker: nextHasCameraPicker,
    hasFilePicker: nextHasFilePicker,
    hasImagePicker: nextHasImagePicker,
    selectedPicker: nextSelectedPicker,
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

  if (prevSelectedPicker !== nextSelectedPicker) {
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
  const { selectedPicker } = useAttachmentPickerContext();
  const { uploadFile } = useOwnCapabilitiesContext();

  return (
    <MemoizedInputButtonsWithContext
      {...{
        AttachButton,
        hasCameraPicker,
        hasCommands,
        hasFilePicker,
        hasImagePicker,
        selectedPicker,
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
