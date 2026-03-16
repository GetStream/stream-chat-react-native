import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

type AutoCompleteInputPropsWithContext = TextInputProps &
  Pick<ChannelContextValue, 'channel'> &
  Pick<MessageInputContextValue, 'setInputBoxRef'> &
  Pick<TranslationContextValue, 't'> & {
    /**
     * This is currently passed in from MessageInput to avoid rerenders
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
    (e: TextInputSelectionChangeEvent) => {
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
      messageInput: { inputBox },
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
      ref={setInputBoxRef}
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

AutoCompleteInput.displayName = 'AutoCompleteInput{messageInput{inputBox}}';
