import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  attachButtonContainer: { paddingRight: 5 },
});

export type InputButtonsProps = Partial<InputButtonsWithContextProps>;

export type InputButtonsWithContextProps = Pick<
  MessageInputContextValue,
  | 'AttachButton'
  | 'CommandsButton'
  | 'giphyActive'
  | 'hasCameraPicker'
  | 'hasCommands'
  | 'hasFilePicker'
  | 'hasImagePicker'
  | 'MoreOptionsButton'
  | 'openCommandsPicker'
  | 'selectedPicker'
  | 'setShowMoreOptions'
  | 'showMoreOptions'
  | 'toggleAttachmentPicker'
>;

export const InputButtonsWithContext = (props: InputButtonsWithContextProps) => {
  const {
    AttachButton,
    CommandsButton,
    giphyActive,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    MoreOptionsButton,
    openCommandsPicker,
    setShowMoreOptions,
    showMoreOptions,
  } = props;

  const {
    theme: {
      messageInput: { attachButtonContainer, commandsButtonContainer },
    },
  } = useTheme();

  const handleShowMoreOptions = useCallback(() => {
    setShowMoreOptions(true);
  }, [setShowMoreOptions]);

  const ownCapabilities = useOwnCapabilitiesContext();

  if (giphyActive) {
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
      {hasCommands && (
        <View style={commandsButtonContainer}>
          <CommandsButton handleOnPress={openCommandsPicker} />
        </View>
      )}
    </>
  );
};

const areEqual = (
  prevProps: InputButtonsWithContextProps,
  nextProps: InputButtonsWithContextProps,
) => {
  const {
    giphyActive: prevGiphyActive,
    hasCameraPicker: prevHasCameraPicker,
    hasCommands: prevHasCommands,
    hasFilePicker: prevHasFilePicker,
    hasImagePicker: prevHasImagePicker,
    selectedPicker: prevSelectedPicker,
    showMoreOptions: prevShowMoreOptions,
  } = prevProps;

  const {
    giphyActive: nextGiphyActive,
    hasCameraPicker: nextHasCameraPicker,
    hasCommands: nextHasCommands,
    hasFilePicker: nextHasFilePicker,
    hasImagePicker: nextHasImagePicker,
    selectedPicker: nextSelectedPicker,
    showMoreOptions: nextShowMoreOptions,
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

  if (prevShowMoreOptions !== nextShowMoreOptions) {
    return false;
  }

  if (prevGiphyActive !== nextGiphyActive) {
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
    giphyActive,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    MoreOptionsButton,
    openCommandsPicker,
    selectedPicker,
    setShowMoreOptions,
    showMoreOptions,
    toggleAttachmentPicker,
  } = useMessageInputContext();

  return (
    <MemoizedInputButtonsWithContext
      {...{
        AttachButton,
        CommandsButton,
        giphyActive,
        hasCameraPicker,
        hasCommands,
        hasFilePicker,
        hasImagePicker,
        MoreOptionsButton,
        openCommandsPicker,
        selectedPicker,
        setShowMoreOptions,
        showMoreOptions,
        toggleAttachmentPicker,
      }}
      {...props}
    />
  );
};
