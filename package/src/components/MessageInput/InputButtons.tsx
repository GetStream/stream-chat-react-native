import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TextComposerState } from 'stream-chat';

import {
  AttachmentPickerContextValue,
  OwnCapabilitiesContextValue,
  useAttachmentPickerContext,
} from '../../contexts';
import { useAttachmentManagerState } from '../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';

export type InputButtonsProps = Partial<InputButtonsWithContextProps>;

export type InputButtonsWithContextProps = Pick<
  MessageInputContextValue,
  | 'AttachButton'
  | 'CommandsButton'
  | 'hasCameraPicker'
  | 'hasCommands'
  | 'hasFilePicker'
  | 'hasImagePicker'
  | 'MoreOptionsButton'
  | 'toggleAttachmentPicker'
> &
  Pick<AttachmentPickerContextValue, 'selectedPicker'> &
  Pick<OwnCapabilitiesContextValue, 'uploadFile'>;

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
  hasText: !!state.text,
});

export const InputButtonsWithContext = (props: InputButtonsWithContextProps) => {
  const {
    AttachButton,
    CommandsButton,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    MoreOptionsButton,
    uploadFile: ownCapabilitiesUploadFile,
  } = props;
  const { textComposer } = useMessageComposer();
  const { command, hasText } = useStateStore(textComposer.state, textComposerStateSelector);

  const [showMoreOptions, setShowMoreOptions] = useState(true);
  const { attachments } = useAttachmentManagerState();

  const shouldShowMoreOptions = hasText || attachments.length;

  useEffect(() => {
    setShowMoreOptions(!shouldShowMoreOptions);
  }, [shouldShowMoreOptions]);

  const {
    theme: {
      messageInput: { attachButtonContainer },
    },
  } = useTheme();

  const handleShowMoreOptions = useCallback(() => {
    setShowMoreOptions(true);
  }, [setShowMoreOptions]);

  const hasAttachmentUploadCapabilities =
    (hasCameraPicker || hasFilePicker || hasImagePicker) && ownCapabilitiesUploadFile;
  const showCommandsButton = hasCommands && !hasText;

  if (command) {
    return null;
  }

  if (!hasAttachmentUploadCapabilities && !hasCommands) {
    return null;
  }

  return !showMoreOptions ? (
    <MoreOptionsButton handleOnPress={handleShowMoreOptions} />
  ) : (
    <>
      {hasAttachmentUploadCapabilities ? (
        <View
          style={[hasCommands ? styles.attachButtonContainer : undefined, attachButtonContainer]}
        >
          <AttachButton />
        </View>
      ) : null}
      {showCommandsButton ? <CommandsButton /> : null}
    </>
  );
};

const areEqual = (
  prevProps: InputButtonsWithContextProps,
  nextProps: InputButtonsWithContextProps,
) => {
  const {
    hasCameraPicker: prevHasCameraPicker,
    hasCommands: prevHasCommands,
    hasFilePicker: prevHasFilePicker,
    hasImagePicker: prevHasImagePicker,
    selectedPicker: prevSelectedPicker,
  } = prevProps;

  const {
    hasCameraPicker: nextHasCameraPicker,
    hasCommands: nextHasCommands,
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

  if (prevHasCommands !== nextHasCommands) {
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
    CommandsButton,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    MoreOptionsButton,
    toggleAttachmentPicker,
  } = useMessageInputContext();
  const { selectedPicker } = useAttachmentPickerContext();
  const { uploadFile } = useOwnCapabilitiesContext();

  return (
    <MemoizedInputButtonsWithContext
      {...{
        AttachButton,
        CommandsButton,
        hasCameraPicker,
        hasCommands,
        hasFilePicker,
        hasImagePicker,
        MoreOptionsButton,
        selectedPicker,
        toggleAttachmentPicker,
        uploadFile,
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  attachButtonContainer: { paddingRight: 5 },
});
