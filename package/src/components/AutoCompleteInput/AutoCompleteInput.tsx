import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  Platform,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps,
  TextInputSelectionChangeEvent,
} from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import { MessageComposerConfig, TextComposerState } from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import type { MessageInputContextValue } from '../../contexts/messageInputContext/MessageInputContext';
import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import { useStableCallback } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';
import { useCooldownRemaining } from '../MessageInput/hooks/useCooldownRemaining';

export type TextInputOverrideComponent =
  | typeof RNTextInput
  | React.ComponentClass<TextInputProps>
  | React.ForwardRefExoticComponent<TextInputProps & React.RefAttributes<RNTextInput>>;

type AnimatedTextInputRendererProps = TextInputProps & {
  TextInputComponent: TextInputOverrideComponent;
};

const TextInputRenderer = React.forwardRef<RNTextInput, AnimatedTextInputRendererProps>(
  ({ TextInputComponent: Component, ...props }, ref) => <Component {...props} ref={ref} />,
);

const AnimatedTextInputRenderer = Animated.createAnimatedComponent(TextInputRenderer);

const setRef = <T,>(ref: React.Ref<T> | undefined, value: T | null) => {
  if (!ref) {
    return;
  }

  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  (ref as React.RefObject<T | null>).current = value;
};

type AutoCompleteInputPropsWithContext = TextInputProps &
  Pick<ChannelContextValue, 'channel'> &
  Pick<MessageInputContextValue, 'setInputBoxRef'> &
  Pick<TranslationContextValue, 't'> & {
    /**
     * This is currently passed in from MessageComposer to avoid rerenders
     * that would happen if we put this in the MessageInputContext
     */
    cooldownRemainingSeconds?: number;
    TextInputComponent?: TextInputOverrideComponent;
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
const LINE_HEIGHT = 20;
const INPUT_VERTICAL_PADDING = Platform.OS === 'ios' ? 7 : 12;

const commandPlaceHolders: Record<string, string> = {
  giphy: 'Search GIFs',
  ban: '@username',
  unban: '@username',
  mute: '@username',
  unmute: '@username',
};

const AutoCompleteInputWithContext = (props: AutoCompleteInputPropsWithContext) => {
  const styles = useStyles();
  const {
    channel,
    cooldownRemainingSeconds,
    setInputBoxRef,
    t,
    TextInputComponent = RNTextInput,
    placeholder,
    ...rest
  } = props;
  const [localText, setLocalText] = useState('');
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

  const clearState = useCallback(() => {
    setLocalText('');
  }, []);

  const restoreState = useStableCallback((restoredText: string) => {
    setLocalText(restoredText);
  });

  const setExtendedInputRef = useCallback(
    (ref: RNTextInput | null) => {
      if (!ref) {
        setRef(setInputBoxRef, null);
        return;
      }

      const inputBoxRef = Object.assign(ref, {
        clearState,
        restoreState,
      });
      setRef(setInputBoxRef, inputBoxRef);
    },
    [clearState, restoreState, setInputBoxRef],
  );

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
      messageComposer: { inputBox },
      semantics,
    },
  } = useTheme();

  const placeholderText = useMemo(() => {
    return placeholder
      ? placeholder
      : command
        ? commandPlaceHolders[command.name ?? '']
        : cooldownRemainingSeconds
          ? t('Slow mode, wait {{seconds}}s...', { seconds: cooldownRemainingSeconds })
          : t('Send a message');
  }, [command, cooldownRemainingSeconds, t, placeholder]);

  return (
    <AnimatedTextInputRenderer
      TextInputComponent={TextInputComponent}
      layout={LinearTransition.duration(200)}
      autoFocus={!!command}
      editable={enabled}
      maxLength={maxMessageLength}
      multiline
      onChangeText={onChangeTextHandler}
      onSelectionChange={handleSelectionChange}
      placeholder={placeholderText}
      placeholderTextColor={semantics.inputTextPlaceholder}
      ref={setExtendedInputRef}
      style={[
        styles.inputBox,
        {
          maxHeight: LINE_HEIGHT * numberOfLines + INPUT_VERTICAL_PADDING * 2,
          paddingLeft: command ? 0 : 16,
          paddingRight: command ? 4 : 8,
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
  const {
    channel: prevChannel,
    cooldownRemainingSeconds: prevCooldownRemainingSeconds,
    t: prevT,
  } = prevProps;
  const {
    channel: nextChannel,
    cooldownRemainingSeconds: nextCooldownRemainingSeconds,
    t: nextT,
  } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const cooldownRemainingSecondsEqual =
    prevCooldownRemainingSeconds === nextCooldownRemainingSeconds;
  if (!cooldownRemainingSecondsEqual) {
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
  const cooldownRemainingSeconds = useCooldownRemaining();

  return (
    <MemoizedAutoCompleteInput
      {...{
        channel,
        setInputBoxRef,
        t,
        cooldownRemainingSeconds,
      }}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      inputBox: {
        color: semantics.inputTextDefault,
        flex: 1,
        fontSize: 16,
        includeFontPadding: false, // for android vertical text centering
        lineHeight: 20,
        paddingLeft: 16,
        paddingVertical: 12,
        textAlignVertical: 'center', // for android vertical text centering
        alignSelf: 'center',
      },
    });
  }, [semantics]);
};

AutoCompleteInput.displayName = 'AutoCompleteInput{messageComposer{inputBox}}';
