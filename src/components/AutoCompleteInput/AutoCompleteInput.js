import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { SuggestionsContext, TranslationContext } from '../../context';

const InputBox = styled.TextInput`
  flex: 1;
  margin: -5px;
  max-height: 60px;
  ${({ theme }) => theme.messageInput.inputBox.css}
`;

const computeCaretPosition = (token, startOfTokenPosition) =>
  startOfTokenPosition + token.length;

const isCommand = (text) => {
  if (text[0] !== '/') {
    return false;
  }

  const tokens = text.split(' ');

  if (tokens.length > 1) {
    return false;
  }

  return true;
};

const AutoCompleteInput = ({
  additionalTextInputProps,
  onChange,
  setInputBoxRef,
  triggerSettings,
  value,
}) => {
  const {
    closeSuggestions,
    openSuggestions,
    updateSuggestions: updateSuggestionsContext,
  } = useContext(SuggestionsContext);
  const { t } = useContext(TranslationContext);

  const isTrackingStarted = useRef(false);

  const [selectionEnd, setSelectionEnd] = useState(0);

  useEffect(() => {
    handleChange(value, true);
  }, [handleChange, value]);

  const startTracking = (trigger) => {
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

  const updateSuggestions = async ({ query, trigger }) => {
    await triggerSettings[trigger].dataProvider(
      query,
      value,
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
  };

  const handleChange = (text, fromUpdate = false) => {
    if (!fromUpdate) {
      onChange(text);
    } else {
      handleSuggestions(text);
    }
  };

  const handleSelectionChange = ({
    nativeEvent: {
      selection: { end },
    },
  }) => {
    setSelectionEnd(end);
  };

  const onSelectSuggestion = ({ item, trigger }) => {
    const newToken = triggerSettings[trigger].output(item);

    if (!trigger) {
      return;
    }

    const textToModify = value.slice(0, selectionEnd);

    const startOfTokenPosition = textToModify.search(
      /**
       * It's important to escape the trigger char for chars like [, (,...
       */
      new RegExp(`\\${trigger}${`[^\\${trigger}${'\\s'}]`}*$`),
    );

    const newTokenString = `${newToken.text} `;

    const newCaretPosition = computeCaretPosition(
      newTokenString,
      startOfTokenPosition,
    );

    const modifiedText = `${textToModify.substring(
      0,
      startOfTokenPosition,
    )}${newTokenString}`;

    stopTracking();
    onChange(value.replace(textToModify, modifiedText));

    setSelectionEnd(newCaretPosition || 0);

    if (triggerSettings[trigger].callback) {
      triggerSettings[trigger].callback(item);
    }
  };

  const handleCommand = async (text) => {
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

  const handleMentions = ({ selectionEnd: selectionEndProp, text }) => {
    const minChar = 0;

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
    if (!lastToken || lastToken.length <= minChar) {
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

  const handleSuggestions = (text) => {
    setTimeout(async () => {
      if (
        text.slice(selectionEnd - 1, selectionEnd) === ' ' &&
        !isTrackingStarted.current
      ) {
        stopTracking();
      } else if (!(await handleCommand(text))) {
        handleMentions({ selectionEnd, text });
      }
    }, 100);
  };

  return (
    <InputBox
      multiline
      onChangeText={(text) => {
        handleChange(text);
      }}
      onSelectionChange={handleSelectionChange}
      placeholder={t('Write your message')}
      ref={setInputBoxRef}
      testID='auto-complete-text-input'
      value={value}
      {...additionalTextInputProps}
    />
  );
};

AutoCompleteInput.propTypes = {
  /**
   * Additional props for underlying TextInput component. These props will be forwarded as it is to TextInput component.
   *
   * @see See https://facebook.github.io/react-native/docs/textinput#reference
   */
  additionalTextInputProps: PropTypes.object,
  /**
   * @param text string
   */
  onChange: PropTypes.func,
  setInputBoxRef: PropTypes.func,
  triggerSettings: PropTypes.object,
  value: PropTypes.string,
};

export default AutoCompleteInput;
