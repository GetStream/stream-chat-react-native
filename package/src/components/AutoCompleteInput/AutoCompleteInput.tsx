import React, { useCallback, useMemo, useState } from 'react';
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

type AutoCompleteInputPropsWithContext = TextInputProps &
  Pick<
    MessageInputContextValue,
    'maxMessageLength' | 'numberOfLines' | 'onChangeText' | 'setInputBoxRef'
  > &
  Pick<TranslationContextValue, 't'> & {
    /**
     * This is currently passed in from MessageInput to avoid rerenders
     * that would happen if we put this in the MessageInputContext
     */
    cooldownActive?: boolean;
  };

export type AutoCompleteInputProps = Partial<AutoCompleteInputPropsWithContext>;

const textComposerStateSelector = (state: TextComposerState) => ({
  text: state.text,
});

const customComposerDataSelector = (state: CustomDataManagerState) => ({
  command: state.custom.command,
});

const AutoCompleteInputWithContext = (props: AutoCompleteInputPropsWithContext) => {
  const {
    cooldownActive = false,
    maxMessageLength,
    numberOfLines,
    onChangeText,
    setInputBoxRef,
    t,
    ...rest
  } = props;
  const [textHeight, setTextHeight] = useState(0);
  const messageComposer = useMessageComposer();
  const { customDataManager, textComposer } = messageComposer;
  const { text } = useStateStore(textComposer.state, textComposerStateSelector);
  const { command } = useStateStore(customDataManager.state, customComposerDataSelector);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const { selection } = e.nativeEvent;
      textComposer.setSelection(selection);
    },
    [textComposer],
  );

  const onTextChangeHandler = useCallback(
    (newText: string) => {
      if (onChangeText) {
        onChangeText(newText);
        return;
      }

      textComposer.setText(newText);
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
    [textComposer, onChangeText],
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
      value={text}
      {...rest}
    />
  );
};

const areEqual = (
  prevProps: AutoCompleteInputPropsWithContext,
  nextProps: AutoCompleteInputPropsWithContext,
) => {
  const { cooldownActive: prevCooldownActive, t: prevT } = prevProps;
  const { cooldownActive: nextCooldownActive, t: nextT } = nextProps;

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
  const { maxMessageLength, numberOfLines, onChangeText, setInputBoxRef } =
    useMessageInputContext();
  const { t } = useTranslationContext();

  return (
    <MemoizedAutoCompleteInput
      {...{
        maxMessageLength,
        numberOfLines,
        onChangeText,
        setInputBoxRef,
        t,
      }}
      {...props}
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
