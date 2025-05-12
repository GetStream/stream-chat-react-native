import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  I18nManager,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputContentSizeChangeEventData,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native';

import { CustomDataManagerState, TextComposerState } from 'stream-chat';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import { useStateStore } from '../../hooks/useStateStore';

type AutoCompleteInputProps = TextInputProps &
  Partial<Pick<MessageInputContextValue, 'setInputBoxRef'>> &
  Partial<Pick<TranslationContextValue, 't'>> & {
    /**
     * This is currently passed in from MessageInput to avoid rerenders
     * that would happen if we put this in the MessageInputContext
     */
    cooldownActive?: boolean;
  };

const textComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const customComposerDataSelector = (state: CustomDataManagerState) => ({
  command: state.custom.command,
});

const MAX_NUMBER_OF_LINES = 5;

export const AutoCompleteInput = (props: AutoCompleteInputProps) => {
  const { cooldownActive = false, setInputBoxRef: propSetInputBoxRef, t: propT, ...rest } = props;
  const [localText, setLocalText] = useState('');
  const [textHeight, setTextHeight] = useState(0);
  const messageComposer = useMessageComposer();
  const { customDataManager, textComposer } = messageComposer;
  const { text } = useStateStore(textComposer.state, textComposerStateSelector);
  const { command } = useStateStore(customDataManager.state, customComposerDataSelector);
  const { channel } = useChannelContext();
  const { setInputBoxRef: contextSetInputBoxRef } = useMessageInputContext();
  const { t: contextT } = useTranslationContext();

  const setInputBoxRef = propSetInputBoxRef || contextSetInputBoxRef;
  const t = propT || contextT;

  const maxMessageLength = useMemo(() => {
    return channel.getConfig()?.max_message_length;
  }, [channel]);

  const numberOfLines = useMemo(() => {
    if (props.numberOfLines) {
      return props.numberOfLines;
    }

    return MAX_NUMBER_OF_LINES;
  }, [props.numberOfLines]);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const { selection } = e.nativeEvent;
      textComposer.setSelection(selection);
    },
    [textComposer],
  );

  const onChangeTextHandler = useCallback(
    (newText: string) => {
      setLocalText(newText);

      /**
       * This is a hack to ensure the selection is up to date. We should find a better way to do this.
       * The onSelectChange event is triggered after the onChangeText event currently which is why the selection value is stale.
       */
      setTimeout(() => {
        textComposer.handleChange({
          selection: textComposer.selection,
          text: newText,
        });
      }, 0);
    },
    [textComposer],
  );

  const {
    theme: {
      colors: { black, grey },
      messageInput: { inputBox },
    },
  } = useTheme();

  const placeholderText = useMemo(() => {
    return command ? t('Search GIFs') : cooldownActive ? t('Slow mode ON') : t('Send a message');
  }, [command, cooldownActive, t]);

  const handleContentSizeChange = useCallback(
    ({
      nativeEvent: { contentSize },
    }: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      setTextHeight(contentSize.height);
    },
    [],
  );

  return (
    <TextInput
      autoFocus={!!command}
      maxLength={maxMessageLength}
      multiline
      onChangeText={onChangeTextHandler}
      onContentSizeChange={handleContentSizeChange}
      onSelectionChange={handleSelectionChange}
      placeholder={placeholderText}
      placeholderTextColor={grey}
      ref={setInputBoxRef}
      style={[
        styles.inputBox,
        {
          color: black,
          maxHeight: (textHeight || 17) * numberOfLines,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        inputBox,
      ]}
      testID='auto-complete-text-input'
      value={localText}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  inputBox: {
    flex: 1,
    fontSize: 16,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
});

AutoCompleteInput.displayName = 'AutoCompleteInput{messageInput{inputBox}}';
