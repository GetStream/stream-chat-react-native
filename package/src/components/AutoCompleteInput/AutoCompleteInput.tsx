import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import throttle from 'lodash/throttle';

import { CommandsHeader } from './CommandsHeader';
import { EmojisHeader } from './EmojisHeader';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  isSuggestionCommand,
  isSuggestionEmoji,
  isSuggestionUser,
  Suggestion,
  SuggestionCommand,
  SuggestionsContextValue,
  SuggestionUser,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { isCommandTrigger, isEmojiTrigger, isMentionTrigger } from '../../utils/utils';

import type { TextInputProps } from 'react-native';

import type { Emoji } from '../../emoji-data/compiled';
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
import type { Trigger } from '../../utils/utils';

const styles = StyleSheet.create({
  inputBox: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
});

const computeCaretPosition = (token: string, startOfTokenPosition: number) =>
  startOfTokenPosition + token.length;

const isCommand = (text: string) => text[0] === '/' && text.split(' ').length <= 1;

type AutoCompleteInputPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'giphyEnabled'> &
  Pick<
    MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'additionalTextInputProps'
    | 'autoCompleteSuggestionsLimit'
    | 'giphyActive'
    | 'maxMessageLength'
    | 'numberOfLines'
    | 'onChange'
    | 'setGiphyActive'
    | 'setInputBoxRef'
    | 'setShowMoreOptions'
    | 'text'
    | 'triggerSettings'
  > &
  Pick<
    SuggestionsContextValue<Co, Us>,
    'closeSuggestions' | 'openSuggestions' | 'updateSuggestions'
  > &
  Pick<TranslationContextValue, 't'>;

export type AutoCompleteInputProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<AutoCompleteInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

const AutoCompleteInputWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: AutoCompleteInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTextInputProps,
    autoCompleteSuggestionsLimit,
    closeSuggestions,
    giphyActive,
    giphyEnabled,
    maxMessageLength,
    numberOfLines,
    onChange,
    openSuggestions,
    setGiphyActive,
    setInputBoxRef,
    setShowMoreOptions,
    t,
    text,
    triggerSettings,
    updateSuggestions: updateSuggestionsContext,
  } = props;

  const isTrackingStarted = useRef(false);
  const selectionEnd = useRef(0);
  const [textHeight, setTextHeight] = useState(0);

  const {
    theme: {
      colors: { black, grey },
      messageInput: { inputBox },
    },
  } = useTheme();

  const handleChange = (newText: string, fromUpdate = false) => {
    if (!fromUpdate) {
      onChange(newText);
    } else {
      handleSuggestionsThrottled(newText);
    }
  };

  useEffect(() => {
    handleChange(text, true);
  }, [text]);

  const startTracking = (trigger: Trigger) => {
    const triggerSetting = triggerSettings[trigger];
    if (triggerSetting) {
      isTrackingStarted.current = true;
      const { component: Component } = triggerSetting;
      openSuggestions(
        typeof Component === 'string' ? Component : <Component />,
        trigger === ':' ? (
          <EmojisHeader title='' />
        ) : trigger === '/' ? (
          <CommandsHeader />
        ) : undefined,
      );
    }
  };

  const stopTracking = () => {
    isTrackingStarted.current = false;
    closeSuggestions();
  };

  const updateSuggestions = async ({
    query,
    trigger,
  }: {
    query: Suggestion['name'];
    trigger: Trigger;
  }) => {
    if (isMentionTrigger(trigger)) {
      const triggerSetting = triggerSettings[trigger];
      if (triggerSetting) {
        await triggerSetting.dataProvider(
          query as SuggestionUser<Us>['name'],
          text,
          (data, queryCallback) => {
            if (query === queryCallback) {
              updateSuggestionsContext({
                data,
                onSelect: (item) => onSelectSuggestion({ item, trigger }),
              });
            }
          },
          autoCompleteSuggestionsLimit,
        );
      }
    } else if (isCommandTrigger(trigger)) {
      const triggerSetting = triggerSettings[trigger];
      if (triggerSetting) {
        await triggerSetting.dataProvider(
          query as SuggestionCommand<Co>['name'],
          text,
          (data, queryCallback) => {
            if (query !== queryCallback) {
              return;
            }

            updateSuggestionsContext({
              data,
              onSelect: (item) => onSelectSuggestion({ item, trigger }),
            });
          },
          autoCompleteSuggestionsLimit,
        );
      }
    } else {
      const triggerSetting = triggerSettings[trigger];
      if (triggerSetting) {
        await triggerSetting.dataProvider(query as Emoji['name'], text, (data, queryCallback) => {
          if (query !== queryCallback) {
            return;
          }

          updateSuggestionsContext(
            {
              data,
              onSelect: (item) => onSelectSuggestion({ item, trigger }),
            },
            <EmojisHeader title={query} />,
          );
        });
      }
    }
  };

  const handleSelectionChange: TextInputProps['onSelectionChange'] = ({
    nativeEvent: {
      selection: { end },
    },
  }) => {
    selectionEnd.current = end;
  };

  const onSelectSuggestion = ({
    item,
    trigger,
  }: {
    item: Suggestion<Co, Us>;
    trigger: Trigger;
  }) => {
    if (!trigger || !triggerSettings[trigger]) {
      return;
    }

    let newTokenString = '';
    if (isCommandTrigger(trigger) && isSuggestionCommand(item)) {
      const triggerSetting = triggerSettings[trigger];
      if (triggerSetting) {
        newTokenString = `${triggerSetting.output(item).text} `;
      }
    }
    if (isEmojiTrigger(trigger) && isSuggestionEmoji(item)) {
      const triggerSetting = triggerSettings[trigger];
      if (triggerSetting) {
        newTokenString = `${triggerSetting.output(item).text} `;
      }
    }
    if (isMentionTrigger(trigger) && isSuggestionUser(item)) {
      const triggerSetting = triggerSettings[trigger];
      if (triggerSetting) {
        newTokenString = `${triggerSetting.output(item).text} `;
      }
    }

    const textToModify = text.slice(0, selectionEnd.current);

    const startOfTokenPosition = textToModify.search(
      /**
       * It's important to escape the trigger char for chars like [, (,...
       */
      new RegExp(`\\${trigger}${`[^\\${trigger}${'\\s'}]`}*$`),
    );

    const newCaretPosition = computeCaretPosition(newTokenString, startOfTokenPosition);

    const modifiedText = `${textToModify.substring(0, startOfTokenPosition)}${newTokenString}`;

    stopTracking();

    const newText = text.replace(textToModify, modifiedText);

    if (giphyEnabled && newText.startsWith('/giphy ')) {
      onChange(newText.slice(7)); // 7 because of '/giphy ' length
      setGiphyActive(true);
    } else {
      onChange(newText);
    }

    selectionEnd.current = newCaretPosition || 0;

    if (isMentionTrigger(trigger) && isSuggestionUser(item)) {
      const triggerSetting = triggerSettings[trigger];
      if (triggerSetting) {
        triggerSetting.callback(item);
      }
    }
  };

  const handleCommand = async (text: string) => {
    if (!isCommand(text)) {
      return false;
    }

    if (!isTrackingStarted.current) {
      startTracking('/');
    }
    const actualToken = text.trim().slice(1);
    await updateSuggestions({ query: actualToken, trigger: '/' });

    return true;
  };

  const handleMentions = ({ tokenMatch }: { tokenMatch: RegExpMatchArray | null }) => {
    const lastToken = tokenMatch?.[tokenMatch.length - 1].trim();
    const handleMentionsTrigger =
      (lastToken && Object.keys(triggerSettings).find((trigger) => trigger === lastToken[0])) ||
      null;

    /*
      if we lost the trigger token or there is no following character we want to close
      the autocomplete
    */
    if (!lastToken || lastToken.length <= 0) {
      stopTracking();
      return;
    }

    const actualToken = lastToken.slice(1);

    // if trigger is not configured step out from the function, otherwise proceed
    if (!handleMentionsTrigger) {
      return;
    }

    if (!isTrackingStarted.current) {
      startTracking('@');
    }

    updateSuggestions({ query: actualToken, trigger: '@' });
  };

  const handleEmojis = ({ tokenMatch }: { tokenMatch: RegExpMatchArray | null }) => {
    const lastToken = tokenMatch?.[tokenMatch.length - 1].trim();
    const handleEmojisTrigger =
      (lastToken && Object.keys(triggerSettings).find((trigger) => trigger === lastToken[0])) ||
      null;

    /*
      if we lost the trigger token or there is no following character we want to close
      the autocomplete
    */
    if (!lastToken || lastToken.length <= 0) {
      stopTracking();
      return;
    }

    const actualToken = lastToken.slice(1);

    // if trigger is not configured step out from the function, otherwise proceed
    if (!handleEmojisTrigger) {
      return;
    }

    if (!isTrackingStarted.current) {
      startTracking(':');
    }

    updateSuggestions({ query: actualToken, trigger: ':' });
  };

  const handleSuggestions = async (text: string) => {
    if (
      /\s/.test(text.slice(selectionEnd.current - 1, selectionEnd.current)) &&
      isTrackingStarted.current
    ) {
      stopTracking();
    } else if (giphyEnabled && !(await handleCommand(text))) {
      const mentionTokenMatch = text
        .slice(0, selectionEnd.current)
        .match(/(?!^|\W)?@[^\s]*\s?[^\s]*$/g);
      if (mentionTokenMatch) {
        handleMentions({ tokenMatch: mentionTokenMatch });
      } else {
        const emojiTokenMatch = text
          .slice(0, selectionEnd.current)
          .match(/(?!^|\W)?:\w{2,}[^\s]*\s?[^\s]*$/g);
        handleEmojis({ tokenMatch: emojiTokenMatch });
      }
    }
  };

  const handleSuggestionsThrottled = throttle(handleSuggestions, 100, {
    leading: false,
  });

  return (
    <TextInput
      maxLength={maxMessageLength}
      multiline
      onChangeText={(newText) => {
        if (giphyEnabled && newText.startsWith('/giphy ')) {
          handleChange(newText.slice(7)); // 7 because of '/giphy' length
          setGiphyActive(true);
        } else {
          handleChange(newText);
        }
      }}
      onContentSizeChange={({
        nativeEvent: {
          contentSize: { height },
        },
      }) => {
        if (!textHeight) {
          setTextHeight(height);
        }
      }}
      onSelectionChange={handleSelectionChange}
      placeholder={giphyActive ? t('Search GIFs') : t('Send a message')}
      placeholderTextColor={grey}
      ref={setInputBoxRef}
      style={[
        styles.inputBox,
        {
          color: black,
          maxHeight: (textHeight || 17) * numberOfLines,
        },
        inputBox,
      ]}
      testID='auto-complete-text-input'
      value={text}
      {...additionalTextInputProps}
      onBlur={(event) => {
        if (additionalTextInputProps?.onBlur) {
          additionalTextInputProps?.onBlur(event);
        }
        setShowMoreOptions(true);
      }}
    />
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  prevProps: AutoCompleteInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: AutoCompleteInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { giphyActive: prevGiphyActive, t: prevT, text: prevText } = prevProps;
  const { giphyActive: nextGiphyActive, t: nextT, text: nextText } = nextProps;

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) return false;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const textEqual = prevText === nextText;
  if (!textEqual) return false;

  return true;
};

const MemoizedAutoCompleteInput = React.memo(
  AutoCompleteInputWithContext,
  areEqual,
) as typeof AutoCompleteInputWithContext;

export const AutoCompleteInput = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: AutoCompleteInputProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { giphyEnabled } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    additionalTextInputProps,
    autoCompleteSuggestionsLimit,
    giphyActive,
    maxMessageLength,
    numberOfLines,
    onChange,
    setGiphyActive,
    setInputBoxRef,
    setShowMoreOptions,
    text,
    triggerSettings,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { closeSuggestions, openSuggestions, updateSuggestions } = useSuggestionsContext<Co, Us>();
  const { t } = useTranslationContext();

  return (
    <MemoizedAutoCompleteInput
      {...{
        additionalTextInputProps,
        autoCompleteSuggestionsLimit,
        closeSuggestions,
        giphyActive,
        giphyEnabled,
        maxMessageLength,
        numberOfLines,
        onChange,
        openSuggestions,
        setGiphyActive,
        setInputBoxRef,
        setShowMoreOptions,
        t,
        text,
        triggerSettings,
        updateSuggestions,
      }}
      {...props}
    />
  );
};

AutoCompleteInput.displayName = 'AutoCompleteInput{messageInput{inputBox}}';
