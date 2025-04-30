import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  I18nManager,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputContentSizeChangeEventData,
  TextInputSelectionChangeEventData,
} from 'react-native';

import { TextComposerState } from 'stream-chat';

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

type AutoCompleteInputPropsWithContext = Pick<
  MessageInputContextValue,
  | 'additionalTextInputProps'
  | 'giphyActive'
  | 'giphyEnabled'
  | 'maxMessageLength'
  | 'numberOfLines'
  | 'onChangeText'
  | 'setGiphyActive'
  | 'setInputBoxRef'
> &
  Pick<TranslationContextValue, 't'> & {
    /**
     * This is currently passed in from MessageInput to avoid rerenders
     * that would happen if we put this in the MessageInputContext
     */
    cooldownActive?: boolean;
  };

export type AutoCompleteInputProps = Partial<AutoCompleteInputPropsWithContext>;

const messageComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const AutoCompleteInputWithContext = (props: AutoCompleteInputPropsWithContext) => {
  const {
    additionalTextInputProps,
    cooldownActive = false,
    giphyActive,
    giphyEnabled,
    maxMessageLength,
    numberOfLines,
    onChangeText,
    setGiphyActive,
    setInputBoxRef,
    t,
  } = props;
  const [localText, setLocalText] = useState('');
  const [selection, setSelection] = useState({ end: 0, start: 0 });
  const [textHeight, setTextHeight] = useState(0);
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;

  const { text } = useStateStore(textComposer.state, messageComposerStateSelector);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const { selection } = e.nativeEvent;
      if (additionalTextInputProps?.onSelectionChange) {
        additionalTextInputProps.onSelectionChange(e);
        return;
      }
      setSelection(selection);
    },
    [additionalTextInputProps],
  );

  const onTextChangeHandler = useCallback(
    async (newText: string) => {
      if (onChangeText) {
        onChangeText(newText);
        return;
      }
      if (additionalTextInputProps?.onChangeText) {
        additionalTextInputProps.onChangeText(newText);
        return;
      }
      setLocalText(newText);
      const isGiphy = giphyEnabled && newText && newText.startsWith('/giphy ');

      if (isGiphy) {
        setGiphyActive(true);
      }

      await textComposer.handleChange({
        selection: {
          end: selection.end + 1,
          start: selection.start + 1,
        },
        text: isGiphy ? newText.slice(7) : newText,
      });
    },
    [
      additionalTextInputProps,
      giphyEnabled,
      onChangeText,
      textComposer,
      selection.end,
      selection.start,
      setGiphyActive,
    ],
  );

  const {
    theme: {
      colors: { black, grey },
      messageInput: { inputBox },
    },
  } = useTheme();

  const placeholderText = useMemo(() => {
    return giphyActive
      ? t('Search GIFs')
      : cooldownActive
        ? t('Slow mode ON')
        : t('Send a message');
  }, [cooldownActive, giphyActive, t]);

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
      autoFocus={giphyActive}
      maxLength={maxMessageLength}
      multiline
      onChangeText={onTextChangeHandler}
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
      {...additionalTextInputProps}
    />
  );
};

const areEqual = (
  prevProps: AutoCompleteInputPropsWithContext,
  nextProps: AutoCompleteInputPropsWithContext,
) => {
  const { cooldownActive: prevCooldownActive, giphyActive: prevGiphyActive, t: prevT } = prevProps;
  const { cooldownActive: nextCooldownActive, giphyActive: nextGiphyActive, t: nextT } = nextProps;

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) {
    return false;
  }

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const cooldownActiveEqual = prevCooldownActive === nextCooldownActive;
  if (!cooldownActiveEqual) {
    return false;
  }

  return true;
};

const MemoizedAutoCompleteInput = React.memo(
  AutoCompleteInputWithContext,
  areEqual,
) as typeof AutoCompleteInputWithContext;

export const AutoCompleteInput = (props: AutoCompleteInputProps) => {
  const {
    giphyEnabled,
    additionalTextInputProps,
    giphyActive,
    maxMessageLength,
    numberOfLines,
    onChangeText,
    setGiphyActive,
    setInputBoxRef,
  } = useMessageInputContext();
  const { t } = useTranslationContext();

  return (
    <MemoizedAutoCompleteInput
      {...{
        additionalTextInputProps,
        giphyActive,
        giphyEnabled,
        maxMessageLength,
        numberOfLines,
        onChangeText,
        setGiphyActive,
        setInputBoxRef,
        t,
      }}
      {...props}
    />
  );
};

AutoCompleteInput.displayName = 'AutoCompleteInput{messageInput{inputBox}}';
