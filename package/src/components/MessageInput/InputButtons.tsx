import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { StreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  attachButtonContainer: { paddingRight: 10 },
});

export type InputButtonsProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<InputButtonsWithContextProps<At, Ch, Co, Ev, Me, Re, Us>>;

export type InputButtonsWithContextProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<
  MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'AttachButton'
  | 'CommandsButton'
  | 'giphyActive'
  | 'hasCommands'
  | 'hasFilePicker'
  | 'hasImagePicker'
  | 'MoreOptionsButton'
  | 'openCommandsPicker'
  | 'selectedPicker'
  | 'setShowMoreOptions'
  | 'showMoreOptions'
  | 'text'
  | 'toggleAttachmentPicker'
>;

export const InputButtonsWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: InputButtonsWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    AttachButton,
    CommandsButton,
    giphyActive,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    MoreOptionsButton,
    openCommandsPicker,
    setShowMoreOptions,
    showMoreOptions,
    text,
    toggleAttachmentPicker,
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

  return !showMoreOptions && (hasImagePicker || hasFilePicker) && hasCommands ? (
    <MoreOptionsButton handleOnPress={() => setShowMoreOptions(true)} />
  ) : (
    <>
      {(hasImagePicker || hasFilePicker) && ownCapabilities.uploadFile && (
        <View
          style={[hasCommands ? styles.attachButtonContainer : undefined, attachButtonContainer]}
        >
          <AttachButton handleOnPress={toggleAttachmentPicker} />
        </View>
      )}
      {hasCommands && !text && (
        <View style={commandsButtonContainer}>
          <CommandsButton handleOnPress={openCommandsPicker} />
        </View>
      )}
    </>
  );
};
const areEqual = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: InputButtonsWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: InputButtonsWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    giphyActive: prevGiphyActive,
    hasCommands: prevHasCommands,
    hasFilePicker: prevHasFilePicker,
    hasImagePicker: prevHasImagePicker,
    selectedPicker: prevSelectedPicker,
    showMoreOptions: prevShowMoreOptions,
    text: prevText,
  } = prevProps;

  const {
    giphyActive: nextGiphyActive,
    hasCommands: nextHasCommands,
    hasFilePicker: nextHasFilePicker,
    hasImagePicker: nextHasImagePicker,
    selectedPicker: nextSelectedPicker,
    showMoreOptions: nextShowMoreOptions,
    text: nextText,
  } = nextProps;

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

  if ((!prevProps.text && nextText) || (prevText && !nextText)) {
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

export const InputButtons = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: InputButtonsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    AttachButton,
    CommandsButton,
    giphyActive,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    MoreOptionsButton,
    openCommandsPicker,
    selectedPicker,
    setShowMoreOptions,
    showMoreOptions,
    text,
    toggleAttachmentPicker,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MemoizedInputButtonsWithContext
      {...{
        AttachButton,
        CommandsButton,
        giphyActive,
        hasCommands,
        hasFilePicker,
        hasImagePicker,
        MoreOptionsButton,
        openCommandsPicker,
        selectedPicker,
        setShowMoreOptions,
        showMoreOptions,
        text,
        toggleAttachmentPicker,
      }}
      {...props}
    />
  );
};
