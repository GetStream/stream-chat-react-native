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

import { MessageComposerConfig, TextComposerState } from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
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
  Pick<ChannelContextValue, 'channel'> &
  Pick<MessageInputContextValue, 'setInputBoxRef'> &
  Pick<TranslationContextValue, 't'> & {
    /**
     * This is currently passed in from MessageInput to avoid rerenders
     * that would happen if we put this in the MessageInputContext
     */
    cooldownActive?: boolean;
  };

type AutoCompleteInputProps = Partial<AutoCompleteInputPropsWithContext>;

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
  text: state.text,
});

const configStateSelector = (state: MessageComposerConfig) => ({
  enabled: state.text.enabled,
});

const MAX_NUMBER_OF_LINES = 5;

const AutoCompleteInputWithContext = (props: AutoCompleteInputPropsWithContext) => {
  const { channel, cooldownActive = false, setInputBoxRef, t, ...rest } = props;
  const [localText, setLocalText] = useState('');
  const [textHeight, setTextHeight] = useState(0);
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { command, text } = useStateStore(textComposer.state, textComposerStateSelector);
  const { enabled } = useStateStore(messageComposer.configState, configStateSelector);

  const maxMessageLength = useMemo(() => {
    return channel.getConfig()?.max_message_length;
  }, [channel]);

  const numberOfLines = useMemo(() => {
    return props.numberOfLines ?? MAX_NUMBER_OF_LINES;
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

      textComposer.handleChange({
        selection: {
          end: newText.length,
          start: newText.length,
        },
        text: newText,
      });
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
    return command ? t('Search') : cooldownActive ? t('Slow mode ON') : t('Send a message');
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
      editable={enabled}
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

const areEqual = (
  prevProps: AutoCompleteInputPropsWithContext,
  nextProps: AutoCompleteInputPropsWithContext,
) => {
  const { channel: prevChannel, cooldownActive: prevCooldownActive, t: prevT } = prevProps;
  const { channel: nextChannel, cooldownActive: nextCooldownActive, t: nextT } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const cooldownActiveEqual = prevCooldownActive === nextCooldownActive;
  if (!cooldownActiveEqual) {
    return false;
  }

  const channelEqual = prevChannel.cid === nextChannel.cid;
  if (!channelEqual) {
    return false;
  }

  return true;
};

const MemoizedAutoCompleteInput = React.memo(
  AutoCompleteInputWithContext,
  areEqual,
) as typeof AutoCompleteInputWithContext;

export const AutoCompleteInput = (props: AutoCompleteInputProps) => {
  const { setInputBoxRef } = useMessageInputContext();
  const { t } = useTranslationContext();
  const { channel } = useChannelContext();

  return (
    <MemoizedAutoCompleteInput
      {...{
        channel,
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
