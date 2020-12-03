import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
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
import { isMentionTrigger } from '../../utils/utils';

import type { TextInputProps } from 'react-native';

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
    margin: -5,
  },
  inputBoxContainer: {
    alignContent: 'center',
    borderColor: '#EBEBEB',
    borderRadius: 20,
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

const computeCaretPosition = (token: string, startOfTokenPosition: number) =>
  startOfTokenPosition + token.length;

const isCommand = (text: string) =>
  text[0] === '/' && text.split(' ').length <= 1;

type AutoCompleteInputPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'additionalTextInputProps'
  | 'onChange'
  | 'setInputBoxRef'
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
  Us extends UnknownType = DefaultUserType
> = Partial<AutoCompleteInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

const AutoCompleteInputWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: AutoCompleteInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTextInputProps,
    closeSuggestions,
    onChange,
    openSuggestions,
    setInputBoxRef,
    t,
    text,
    triggerSettings,
    updateSuggestions: updateSuggestionsContext,
  } = props;

  const {
    theme: {
      messageInput: { inputBox, inputBoxContainer },
    },
  } = useTheme();

  const isTrackingStarted = useRef(false);
  const selectionEnd = useRef(0);
  const [inputHeight, setInputHeight] = useState(40);
  const handleChange = (newText: string, fromUpdate = false) => {
    if (!fromUpdate) {
      onChange(newText);
    } else {
      handleSuggestions(newText);
    }
  };

  useEffect(() => {
    handleChange(text, true);
  }, [text]);

  const startTracking = (trigger: Trigger) => {
    isTrackingStarted.current = true;
    const { component: Component, title } = triggerSettings[trigger];
    openSuggestions(
      title,
      typeof Component === 'string' ? Component : <Component />,
    );
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
      await triggerSettings[trigger].dataProvider(
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
      );
    } else {
      await triggerSettings[trigger].dataProvider(
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
      );
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
    if (!trigger) {
      return;
    }

    let newTokenString = '';
    if (isMentionTrigger(trigger)) {
      if (isSuggestionUser(item)) {
        newTokenString = `${triggerSettings[trigger].output(item).text} `;
      }
    } else {
      if (!isSuggestionUser(item)) {
        newTokenString = `${triggerSettings[trigger].output(item).text} `;
      }
    }

    const textToModify = text.slice(0, selectionEnd.current);

    const startOfTokenPosition = textToModify.search(
      /**
       * It's important to escape the trigger char for chars like [, (,...
       */
      new RegExp(`\\${trigger}${`[^\\${trigger}${'\\s'}]`}*$`),
    );

    const newCaretPosition = computeCaretPosition(
      newTokenString,
      startOfTokenPosition,
    );

    const modifiedText = `${textToModify.substring(
      0,
      startOfTokenPosition,
    )}${newTokenString}`;

    stopTracking();
    onChange(text.replace(textToModify, modifiedText));

    selectionEnd.current = newCaretPosition || 0;

    if (isMentionTrigger(trigger) && isSuggestionUser(item)) {
      triggerSettings[trigger].callback(item);
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

  const handleMentions = ({
    selectionEnd: selectionEndProp,
    text,
  }: {
    selectionEnd: number;
    text: string;
  }) => {
    const tokenMatch = text
      .slice(0, selectionEndProp)
      .match(/(?!^|\W)?[:@][^\s]*\s?[^\s]*$/g);

    const lastToken = tokenMatch && tokenMatch[tokenMatch.length - 1].trim();
    const handleMentionsTrigger =
      (lastToken &&
        Object.keys(triggerSettings).find(
          (trigger) => trigger === lastToken[0],
        )) ||
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

  const handleSuggestions = (text: string) => {
    setTimeout(async () => {
      if (
        text.slice(selectionEnd.current - 1, selectionEnd.current) === ' ' &&
        !isTrackingStarted.current
      ) {
        stopTracking();
      } else if (!(await handleCommand(text))) {
        handleMentions({ selectionEnd: selectionEnd.current, text });
      }
    }, 100);
  };

  return (
    <View
      style={[
        styles.inputBoxContainer,
        inputBoxContainer,
        {
          // TODO: Investigate why iOS doesn't respect the padding on container while growing height.
          height: Math.min(inputHeight, 100) + (Platform.OS === 'ios' ? 20 : 0),
        },
      ]}
    >
      <TextInput
        multiline
        onChangeText={(text) => {
          handleChange(text);
        }}
        onContentSizeChange={(e) => {
          setInputHeight(e.nativeEvent.contentSize.height);
          console.warn('changed ', e.nativeEvent.contentSize.height);
        }}
        onSelectionChange={handleSelectionChange}
        placeholder={t('Write your message')}
        ref={setInputBoxRef}
        style={[
          styles.inputBox,
          inputBox,
          {
            minHeight: Math.min(inputHeight, 100),
          },
        ]}
        testID='auto-complete-text-input'
        value={text}
        {...additionalTextInputProps}
      />
    </View>
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
  prevProps: AutoCompleteInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: AutoCompleteInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { t: prevT, text: prevText } = prevProps;
  const { t: nextT, text: nextText } = nextProps;

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
  Us extends UnknownType = DefaultUserType
>(
  props: AutoCompleteInputProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTextInputProps,
    onChange,
    setInputBoxRef,
    text,
    triggerSettings,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    closeSuggestions,
    openSuggestions,
    updateSuggestions,
  } = useSuggestionsContext<Co, Us>();
  const { t } = useTranslationContext();

  return (
    <MemoizedAutoCompleteInput
      {...{
        additionalTextInputProps,
        closeSuggestions,
        onChange,
        openSuggestions,
        setInputBoxRef,
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
