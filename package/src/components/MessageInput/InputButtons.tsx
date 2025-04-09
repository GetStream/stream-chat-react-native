import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  attachButtonContainer: { paddingRight: 5 },
});

export type InputButtonsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<InputButtonsWithContextProps<StreamChatGenerics>>;

export type InputButtonsWithContextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageInputContextValue<StreamChatGenerics>,
  | 'AttachButton'
  | 'CommandsButton'
  | 'giphyActive'
  | 'hasCameraPicker'
  | 'hasCommands'
  | 'hasFilePicker'
  | 'hasImagePicker'
  | 'hasText'
  | 'MoreOptionsButton'
  | 'openCommandsPicker'
  | 'selectedPicker'
  | 'setShowMoreOptions'
  | 'showMoreOptions'
  | 'toggleAttachmentPicker'
>;

export const InputButtonsWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: InputButtonsWithContextProps<StreamChatGenerics>,
) => {
  const {
    AttachButton,
    CommandsButton,
    giphyActive,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    hasText,
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

  const ownCapabilities = useOwnCapabilitiesContext();

  if (giphyActive) {
    return null;
  }

  return !showMoreOptions && (hasCameraPicker || hasImagePicker || hasFilePicker) && hasCommands ? (
    <MoreOptionsButton handleOnPress={() => setShowMoreOptions(true)} />
  ) : (
    <>
      {(hasCameraPicker || hasImagePicker || hasFilePicker) && ownCapabilities.uploadFile && (
        <View
          style={[hasCommands ? styles.attachButtonContainer : undefined, attachButtonContainer]}
        >
          <AttachButton />
        </View>
      )}
      {hasCommands && !hasText && (
        <View style={commandsButtonContainer}>
          <CommandsButton handleOnPress={openCommandsPicker} />
        </View>
      )}
    </>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: InputButtonsWithContextProps<StreamChatGenerics>,
  nextProps: InputButtonsWithContextProps<StreamChatGenerics>,
) => {
  const {
    giphyActive: prevGiphyActive,
    hasCameraPicker: prevHasCameraPicker,
    hasCommands: prevHasCommands,
    hasFilePicker: prevHasFilePicker,
    hasImagePicker: prevHasImagePicker,
    hasText: prevHasText,
    selectedPicker: prevSelectedPicker,
    showMoreOptions: prevShowMoreOptions,
  } = prevProps;

  const {
    giphyActive: nextGiphyActive,
    hasCameraPicker: nextHasCameraPicker,
    hasCommands: nextHasCommands,
    hasFilePicker: nextHasFilePicker,
    hasImagePicker: nextHasImagePicker,
    hasText: nextHasText,
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

  if (prevHasText !== nextHasText) {
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

export const InputButtons = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: InputButtonsProps<StreamChatGenerics>,
) => {
  const {
    AttachButton,
    CommandsButton,
    giphyActive,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    hasText,
    MoreOptionsButton,
    openCommandsPicker,
    selectedPicker,
    setShowMoreOptions,
    showMoreOptions,
    toggleAttachmentPicker,
  } = useMessageInputContext<StreamChatGenerics>();

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
        hasText,
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
