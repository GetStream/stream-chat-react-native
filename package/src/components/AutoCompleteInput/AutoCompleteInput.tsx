import React, { useEffect, useRef, useState } from 'react';
import { I18nManager, StyleSheet, TextInput, TextInputProps } from 'react-native';

import {
  SearchSourceState,
  TextComposerState,
  TextComposerSuggestion,
  UserResponse,
} from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  SuggestionComponentType,
  SuggestionsContextValue,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import { useStateStore } from '../../hooks/useStateStore';
import { Trigger } from '../../utils/ACITriggerSettings';

type AutoCompleteInputPropsWithContext = Pick<ChannelContextValue, 'giphyEnabled'> &
  Pick<
    MessageInputContextValue,
    | 'additionalTextInputProps'
    | 'giphyActive'
    | 'maxMessageLength'
    | 'numberOfLines'
    | 'onChange'
    | 'onSelectItem'
    | 'setGiphyActive'
    | 'setInputBoxRef'
    | 'text'
  > &
  Pick<SuggestionsContextValue, 'closeSuggestions' | 'openSuggestions' | 'updateSuggestions'> &
  Pick<TranslationContextValue, 't'> & {
    /**
     * This is currently passed in from MessageInput to avoid rerenders
     * that would happen if we put this in the MessageInputContext
     */
    cooldownActive?: boolean;
  };

export type AutoCompleteInputProps = Partial<AutoCompleteInputPropsWithContext>;

const textComposerStateSelector = (state: TextComposerState) => ({
  suggestions: state.suggestions,
  text: state.text,
});

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  items: nextValue.items,
});

const AutoCompleteInputWithContext = (props: AutoCompleteInputPropsWithContext) => {
  const {
    additionalTextInputProps,
    closeSuggestions,
    cooldownActive = false,
    giphyActive,
    giphyEnabled,
    maxMessageLength,
    numberOfLines,
    onChange,
    onSelectItem,
    openSuggestions,
    setGiphyActive,
    setInputBoxRef,
    t,
    text,
    updateSuggestions,
  } = props;
  const { messageComposer } = useMessageInputContext();
  const { textComposer } = messageComposer;
  const { suggestions, text: textComposerText } = useStateStore(
    textComposer.state,
    textComposerStateSelector,
  );
  const { items: suggestionsItems } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const selectionRef = useRef<{
    end: number;
    start: number;
  }>({
    end: 0,
    start: 0,
  });
  const triggerType = suggestions?.trigger;
  const triggerMap: Record<Trigger, SuggestionComponentType> = {
    '/': 'command',
    ':': 'emoji',
    '@': 'mention',
  };

  const [textHeight, setTextHeight] = useState(0);

  const {
    theme: {
      colors: { black, grey },
      messageInput: { inputBox },
    },
  } = useTheme();

  const handleChange = async (newText: string, fromUpdate = false) => {
    if (fromUpdate) {
      onChange(newText);
      return;
    }

    const isGiphyEnabled = giphyEnabled && newText.startsWith('/giphy ');
    if (isGiphyEnabled) {
      setGiphyActive(true);
    }

    onChange(isGiphyEnabled ? newText.slice(7) : newText);
    await textComposer.handleChange({
      selection: {
        end: selectionRef.current.end + 1,
        start: selectionRef.current.start + 1,
      },
      text: isGiphyEnabled ? newText.slice(7) : newText,
    });
  };

  const handleSelectionChange: TextInputProps['onSelectionChange'] = ({
    nativeEvent: { selection },
  }) => {
    selectionRef.current = selection;
  };

  useEffect(() => {
    handleChange(textComposerText, true);
    if (triggerType) {
      startTracking(triggerType as Trigger);
    } else {
      stopTracking();
    }
    updateSuggestions({
      data: suggestionsItems ?? [],
      onSelect: async (item) => {
        if (triggerType === '@') {
          onSelectItem({
            // @ts-ignore
            id: item?.id,
            name: item.name,
            ...item,
          } as UserResponse);
        }
        await textComposer.handleSelect({
          // @ts-ignore
          id: item?.id,
          name: item.name,
          ...item,
        } as TextComposerSuggestion);
      },
      queryText: suggestions?.query ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textComposerText, triggerType, suggestionsItems?.length]);

  const startTracking = (trigger: Trigger) => {
    openSuggestions(triggerMap[trigger]);
  };

  const stopTracking = () => {
    closeSuggestions();
  };

  const placeholderText = giphyActive
    ? t('Search GIFs')
    : cooldownActive
      ? t('Slow mode ON')
      : t('Send a message');

  return (
    <TextInput
      autoFocus={giphyActive}
      maxLength={maxMessageLength}
      multiline
      onChangeText={async (newText) => {
        await handleChange(newText);
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
      {...additionalTextInputProps}
    />
  );
};

const areEqual = (
  prevProps: AutoCompleteInputPropsWithContext,
  nextProps: AutoCompleteInputPropsWithContext,
) => {
  const {
    cooldownActive: prevCooldownActive,
    giphyActive: prevGiphyActive,
    t: prevT,
    text: prevText,
  } = prevProps;
  const {
    cooldownActive: nextCooldownActive,
    giphyActive: nextGiphyActive,
    t: nextT,
    text: nextText,
  } = nextProps;

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) {
    return false;
  }

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const textEqual = prevText === nextText;
  if (!textEqual) {
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
  const { giphyEnabled } = useChannelContext();
  const {
    additionalTextInputProps,
    giphyActive,
    maxMessageLength,
    numberOfLines,
    onChange,
    onSelectItem,
    setGiphyActive,
    setInputBoxRef,
    text,
  } = useMessageInputContext();
  const { closeSuggestions, openSuggestions, updateSuggestions } = useSuggestionsContext();
  const { t } = useTranslationContext();

  return (
    <MemoizedAutoCompleteInput
      {...{
        additionalTextInputProps,
        closeSuggestions,
        giphyActive,
        giphyEnabled,
        maxMessageLength,
        numberOfLines,
        onChange,
        onSelectItem,
        openSuggestions,
        setGiphyActive,
        setInputBoxRef,
        t,
        text,
        updateSuggestions,
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
