import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputContentSizeChangeEvent,
  TextInputProps,
  TextInputSelectionChangeEvent,
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
    TextInputComponent?: React.ComponentType<
      TextInputProps & {
        ref: React.Ref<RNTextInput> | undefined;
      }
    >;
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
  const {
    channel,
    cooldownActive = false,
    setInputBoxRef,
    t,
    TextInputComponent = RNTextInput,
    ...rest
  } = props;
  const [localText, setLocalText] = useState('');
  const [textHeight, setTextHeight] = useState(0);
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { command, text } = useStateStore(textComposer.state, textComposerStateSelector);
  const { enabled } = useStateStore(messageComposer.configState, configStateSelector);

  // RN's onChangeText doesn't carry cursor info, and iOS / Android fire
  // onChangeText vs onSelectionChange in different orders. Rather than derive
  // the caret from a text-length delta (fragile — gets clobbered by re-renders
  // and varies across platforms), we hold the latest values reported by native
  // and call into the LLC once both have settled.
  const latestTextRef = useRef('');
  const latestSelectionRef = useRef<{ end: number; start: number }>({
    end: 0,
    start: 0,
  });
  const flushHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushChange = useCallback(() => {
    flushHandleRef.current = null;
    textComposer.handleChange({
      selection: latestSelectionRef.current,
      text: latestTextRef.current,
    });
  }, [textComposer]);

  // Defer to the next task so onChangeText and onSelectionChange both land
  // before we forward to the LLC, regardless of platform ordering.
  const scheduleChange = useCallback(() => {
    if (flushHandleRef.current !== null) return;
    flushHandleRef.current = setTimeout(flushChange, 0);
  }, [flushChange]);

  useEffect(() => {
    return () => {
      if (flushHandleRef.current !== null) {
        clearTimeout(flushHandleRef.current);
        flushHandleRef.current = null;
      }
    };
  }, []);

  const maxMessageLength = useMemo(() => {
    return channel.getConfig()?.max_message_length;
  }, [channel]);

  const numberOfLines = useMemo(() => {
    return props.numberOfLines ?? MAX_NUMBER_OF_LINES;
  }, [props.numberOfLines]);

  useEffect(() => {
    setLocalText(text);
    // Only resync the refs when the text change came from outside (clear after
    // send, draft restore, programmatic setText). For changes we triggered
    // ourselves, latestTextRef is already up to date and overwriting the
    // selection would clobber what onSelectionChange just told us.
    if (text !== latestTextRef.current) {
      latestTextRef.current = text;
      latestSelectionRef.current = { end: text.length, start: text.length };
    }
  }, [text]);

  const handleSelectionChange = useCallback(
    (e: TextInputSelectionChangeEvent) => {
      const { selection } = e.nativeEvent;
      latestSelectionRef.current = selection;
      textComposer.setSelection(selection);
      scheduleChange();
    },
    [scheduleChange, textComposer],
  );

  const onChangeTextHandler = useCallback(
    (newText: string) => {
      setLocalText(newText);
      latestTextRef.current = newText;
      scheduleChange();
    },
    [scheduleChange],
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
    ({ nativeEvent: { contentSize } }: TextInputContentSizeChangeEvent) => {
      setTextHeight(contentSize.height);
    },
    [],
  );

  return (
    <TextInputComponent
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
          paddingHorizontal: command ? 4 : 16,
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
    paddingVertical: 12,
    textAlignVertical: 'center', // for android vertical text centering
  },
});

AutoCompleteInput.displayName = 'AutoCompleteInput{messageInput{inputBox}}';
