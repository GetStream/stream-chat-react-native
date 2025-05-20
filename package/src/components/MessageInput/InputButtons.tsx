import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomDataManagerState, TextComposerState } from 'stream-chat';

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
  | 'selectedPicker'
  | 'toggleAttachmentPicker'
>;

const textComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const customComposerDataSelector = (state: CustomDataManagerState) => ({
  command: state.custom.command,
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
  } = props;
  const { customDataManager, textComposer } = useMessageComposer();
  const { text } = useStateStore(textComposer.state, textComposerStateSelector);
  const { command } = useStateStore(customDataManager.state, customComposerDataSelector);
  const [showMoreOptions, setShowMoreOptions] = useState(true);
  const { attachments } = useAttachmentManagerState();

  useEffect(() => {
    if (text.length > 0 || attachments.length > 0) {
      setShowMoreOptions(false);
    } else {
      setShowMoreOptions(true);
    }
  }, [attachments.length, text]);

  const {
    theme: {
      messageInput: { attachButtonContainer },
    },
  } = useTheme();

  const handleShowMoreOptions = useCallback(() => {
    setShowMoreOptions(true);
  }, [setShowMoreOptions]);

  const ownCapabilities = useOwnCapabilitiesContext();

  if (command) {
    return null;
  }

  return !showMoreOptions && (hasCameraPicker || hasImagePicker || hasFilePicker) && hasCommands ? (
    <MoreOptionsButton handleOnPress={handleShowMoreOptions} />
  ) : (
    <>
      {(hasCameraPicker || hasImagePicker || hasFilePicker) && ownCapabilities.uploadFile && (
        <View
          style={[hasCommands ? styles.attachButtonContainer : undefined, attachButtonContainer]}
        >
          <AttachButton />
        </View>
      )}
      {hasCommands && <CommandsButton />}
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
    selectedPicker,
    toggleAttachmentPicker,
  } = useMessageInputContext();

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
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  attachButtonContainer: { paddingRight: 5 },
});
