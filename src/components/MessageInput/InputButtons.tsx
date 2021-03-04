import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  attachButtonContainer: { paddingRight: 10 },
});

export type InputButtonsProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<InputButtonsWithContextProps<At, Ch, Co, Ev, Me, Re, Us>>;

export type InputButtonsWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'AttachButton'
  | 'CommandsButton'
  | 'giphyActive'
  | 'hasCommands'
  | 'hasFilePicker'
  | 'hasImagePicker'
  | 'MoreOptionsButton'
  | 'setShowMoreOptions'
  | 'showMoreOptions'
  | 'text'
  | 'uploadsEnabled'
> & {
  closeAttachmentPicker?: () => void;
  openAttachmentPicker?: () => void;
  openCommandsPicker?: () => void;
  toggleAttachmentPicker?: () => void;
};

export const InputButtonsWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
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
    uploadsEnabled,
  } = props;

  const {
    theme: {
      messageInput: { attachButtonContainer, commandsButtonContainer },
    },
  } = useTheme();

  if (giphyActive) {
    return null;
  }

  return (
    <>
      {!showMoreOptions && (hasImagePicker || hasFilePicker) && hasCommands ? (
        <MoreOptionsButton handleOnPress={() => setShowMoreOptions(true)} />
      ) : (
        <>
          {(hasImagePicker || hasFilePicker) && uploadsEnabled !== false && (
            <View
              style={[
                hasCommands ? styles.attachButtonContainer : undefined,
                attachButtonContainer,
              ]}
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
      )}
    </>
  );
};
const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: InputButtonsWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: InputButtonsWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  if (prevProps.hasImagePicker !== nextProps.hasImagePicker) {
    return false;
  }

  if (prevProps.hasFilePicker !== nextProps.hasFilePicker) {
    return false;
  }

  if (prevProps.hasCommands !== nextProps.hasCommands) {
    return false;
  }

  if (prevProps.uploadsEnabled !== nextProps.uploadsEnabled) {
    return false;
  }

  if (prevProps.showMoreOptions !== nextProps.showMoreOptions) {
    return false;
  }

  if (
    (!prevProps.text && nextProps.text) ||
    (prevProps.text && !nextProps.text)
  ) {
    return false;
  }

  return true;
};

const MemoizedInputButtonsWithContext = React.memo(
  InputButtonsWithContext,
  areEqual,
) as typeof InputButtonsWithContext;

export const InputButtons = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
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
    setShowMoreOptions,
    showMoreOptions,
    text,
    uploadsEnabled,
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
        setShowMoreOptions,
        showMoreOptions,
        text,
        uploadsEnabled,
      }}
      {...props}
    />
  );
};
