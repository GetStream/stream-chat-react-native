import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { TranslationContext } from '../../context';

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
  closeSuggestions,
  onChange,
  openSuggestions,
  setInputBoxRef,
  triggerSettings,
  updateSuggestions: updateSuggestionsProp,
  value,
}) => {
  const { t } = useContext(TranslationContext);

  const isTrackingStarted = useRef(false);

  const [currentTrigger, setCurrentTrigger] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(0);

  useEffect(() => {
    handleChange(value, true);
  }, [handleChange, value]);

  const startTracking = useCallback(
    (trigger) => {
      isTrackingStarted.current = true;
      const { component, title } = triggerSettings[trigger || currentTrigger];
      openSuggestions(title, component);
    },
    [currentTrigger, isTrackingStarted, openSuggestions],
  );

  const stopTracking = useCallback(() => {
    isTrackingStarted.current = false;
    closeSuggestions();
  }, [closeSuggestions, isTrackingStarted]);

  const updateSuggestions = useCallback(
    async (query, trigger) => {
      await triggerSettings[trigger || currentTrigger].dataProvider(
        query,
        value,
        (data, queryCallback) => {
          if (query !== queryCallback) {
            return;
          }

          updateSuggestionsProp({ data, onSelect: onSelectSuggestion });
        },
      );
    },
    [
      currentTrigger,
      onSelectSuggestion,
      triggerSettings,
      updateSuggestionsProp,
      value,
    ],
  );

  const handleChange = (text, fromUpdate = false) => {
    if (!fromUpdate) {
      onChange(text);
    } else {
      handleSuggestions(text);
    }
  };

  const handleSelectionChange = useCallback(
    ({
      nativeEvent: {
        selection: { end },
      },
    }) => {
      setSelectionEnd(end);
    },
    [setSelectionEnd],
  );

  const onSelectSuggestion = useCallback(
    (item) => {
      const newToken = triggerSettings[currentTrigger].output(item);

      if (!currentTrigger) {
        return;
      }

      const textToModify = value.slice(0, selectionEnd);

      const startOfTokenPosition = textToModify.search(
        /**
         * It's important to escape the currentTrigger char for chars like [, (,...
         */
        new RegExp(`\\${currentTrigger}${`[^\\${currentTrigger}${'\\s'}]`}*$`),
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

      if (triggerSettings[currentTrigger].callback) {
        triggerSettings[currentTrigger].callback(item);
      }
    },
    [
      computeCaretPosition,
      currentTrigger,
      onChange,
      selectionEnd,
      setSelectionEnd,
      stopTracking,
      triggerSettings,
      value,
    ],
  );

  const handleCommand = useCallback(
    async (text) => {
      if (!isCommand(text)) {
        return false;
      }

      await setCurrentTrigger('/');
      if (!isTrackingStarted.current) {
        await startTracking('/');
      }
      const actualToken = text.trim().slice(1);
      await updateSuggestions(actualToken, '/');

      return true;
    },
    [
      isCommand,
      isTrackingStarted,
      setCurrentTrigger,
      startTracking,
      updateSuggestions,
    ],
  );

  const handleMentions = useCallback(
    (text, selectionEndProp) => {
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

      setCurrentTrigger(handleMentionsTrigger);
      if (!isTrackingStarted.current) {
        startTracking(handleMentionsTrigger);
      }

      updateSuggestions(actualToken, handleMentionsTrigger);
    },
    [
      isTrackingStarted,
      setCurrentTrigger,
      startTracking,
      stopTracking,
      triggerSettings,
      updateSuggestions,
    ],
  );

  const handleSuggestions = useCallback(
    (text) => {
      setTimeout(async () => {
        if (
          text.slice(selectionEnd - 1, selectionEnd) === ' ' &&
          !isTrackingStarted.current
        ) {
          stopTracking();
        } else if (!(await handleCommand(text))) {
          handleMentions(text, selectionEnd);
        }
      }, 100);
    },
    [
      handleCommand,
      handleMentions,
      isTrackingStarted,
      selectionEnd,
      stopTracking,
    ],
  );

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
  /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
  closeSuggestions: PropTypes.func,
  /**
   * @param text string
   */
  onChange: PropTypes.func,
  /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
  openSuggestions: PropTypes.func,
  setInputBoxRef: PropTypes.func,
  triggerSettings: PropTypes.object,
  /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
  updateSuggestions: PropTypes.func,
  value: PropTypes.string,
};

export default AutoCompleteInput;
