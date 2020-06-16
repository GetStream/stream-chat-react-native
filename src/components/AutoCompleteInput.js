import React from 'react';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../context';

const InputBox = styled.TextInput`
  max-height: 60px;
  margin: -5px;
  flex: 1;
  ${({ theme }) => theme.messageInput.inputBox.css}
`;

class AutoCompleteInput extends React.PureComponent {
  static propTypes = {
    value: PropTypes.string,
    /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
    openSuggestions: PropTypes.func,
    /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
    closeSuggestions: PropTypes.func,
    /** @see See [suggestions context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext) */
    updateSuggestions: PropTypes.func,
    triggerSettings: PropTypes.object,
    setInputBoxRef: PropTypes.func,
    /**
     * @param text string
     */
    onChange: PropTypes.func,
    /**
     * Additional props for underlying TextInput component. These props will be forwarded as it is to TextInput component.
     *
     * @see See https://facebook.github.io/react-native/docs/textinput#reference
     */
    additionalTextInputProps: PropTypes.object,
  };

  static defaultProps = {
    value: undefined,
  };

  constructor(props) {
    super(props);

    this.state = {
      text: props.value,
      selectionStart: 0,
      selectionEnd: 0,
      currentTrigger: null,
    };

    this.isTrackingStarted = false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({ text: this.props.value });
      this.handleChange(this.props.value, true);
    }
  }

  startTracking = () => {
    this.isTrackingStarted = true;
    const { component, title } = this.props.triggerSettings[
      this.state.currentTrigger
    ];
    this.props.openSuggestions(title, component);
  };

  stopTracking = () => {
    this.isTrackingStarted = false;
    this.props.closeSuggestions();
  };

  updateSuggestions = async (q) => {
    this.setState({
      currentTokenForSuggestions: q,
    });
    const triggers = this.props.triggerSettings;
    await triggers[this.state.currentTrigger].dataProvider(
      q,
      this.state.text,
      (data, query) => {
        // Make sure that the result is still relevant for current query
        if (this.state.currentTokenForSuggestions !== query) {
          return;
        }
        this.props.updateSuggestions({
          data,
          onSelect: this.onSelectSuggestion,
        });
      },
    );
  };

  handleChange = (text, fromUpdate = false) => {
    if (!fromUpdate) {
      this.props.onChange(text);
      return;
    }

    this.handleSuggestions(text);
  };

  handleSelectionChange = ({
    nativeEvent: {
      selection: { start, end },
    },
  }) => {
    this.setState({ selectionStart: start, selectionEnd: end });
  };

  onSelectSuggestion = (item) => {
    const { text, currentTrigger } = this.state;
    const { selectionEnd } = this.state;
    const triggers = this.props.triggerSettings;
    const newToken = triggers[currentTrigger].output(item);
    // const { onChange, trigger } = this.props;

    if (!currentTrigger) return;

    const computeCaretPosition = (token, startToken) =>
      startToken + token.length;

    const textToModify = text.slice(0, selectionEnd);

    const startOfTokenPosition = textToModify.search(
      /**
       * It's important to escape the currentTrigger char for chars like [, (,...
       */
      new RegExp(`\\${currentTrigger}${`[^\\${currentTrigger}${'\\s'}]`}*$`),
    );

    // we add space after emoji is selected if a caret position is next
    const newTokenString = `${newToken.text} `;

    const newCaretPosition = computeCaretPosition(
      newTokenString,
      startOfTokenPosition,
    );
    const modifiedText =
      textToModify.substring(0, startOfTokenPosition) + newTokenString;

    this.stopTracking();
    this.props.onChange(text.replace(textToModify, modifiedText));

    this.syncCaretPosition(newCaretPosition);

    if (triggers[currentTrigger].callback)
      triggers[currentTrigger].callback(item);
  };

  syncCaretPosition = async (position = 0) => {
    await this.setState({ selectionStart: position, selectionEnd: position });
  };

  isCommand = (text) => {
    if (text[0] !== '/') return false;

    const tokens = text.split(' ');

    if (tokens.length > 1) return false;

    return true;
  };

  handleCommand = (text) => {
    if (!this.isCommand(text)) {
      return false;
    }

    this.setState({ currentTrigger: '/' }, () => {
      if (!this.isTrackingStarted) this.startTracking();

      const actualToken = text.trim().slice(1);
      return this.updateSuggestions(actualToken);
    });

    return true;
  };

  handleMentions = (text) => {
    const { selectionEnd } = this.state;
    // TODO: Move these const to props
    const minChar = 0;

    const tokenMatch = text
      .slice(0, selectionEnd)
      .match(/(?!^|\W)?[:@][^\s]*\s?[^\s]*$/g);

    const lastToken = tokenMatch && tokenMatch[tokenMatch.length - 1].trim();
    const triggers = this.props.triggerSettings;
    const currentTrigger =
      (lastToken && Object.keys(triggers).find((a) => a === lastToken[0])) ||
      null;

    /*
      if we lost the trigger token or there is no following character we want to close
      the autocomplete
    */
    if (!lastToken || lastToken.length <= minChar) {
      this.stopTracking();
      return;
    }

    const actualToken = lastToken.slice(1);

    // if trigger is not configured step out from the function, otherwise proceed
    if (!currentTrigger) {
      return;
    }

    this.setState({ currentTrigger }, () => {
      if (!this.isTrackingStarted) this.startTracking();
    });

    this.updateSuggestions(actualToken);
  };

  handleSuggestions = (text) => {
    // react native is not consistent in order of execution of onSelectionChange and onTextChange
    // with android and iOS. onSelectionChange gets executed first on iOS (which is ideal for our scenario)
    // Although on android, this order is reveresed. So need to add following 0 timeout to make sure that
    // onSelectionChange is executed first before we proceed with handleSuggestions.
    setTimeout(() => {
      const { selectionEnd: selectionEnd } = this.state;

      if (
        text.slice(selectionEnd - 1, selectionEnd) === ' ' &&
        !this.state.isTrackingStarted
      )
        return;

      if (this.handleCommand(text)) return;

      this.handleMentions(text);
    }, 100);
  };

  render() {
    const { t } = this.props;

    return (
      <InputBox
        ref={this.props.setInputBoxRef}
        placeholder={t('Write your message')}
        onChangeText={(text) => {
          this.handleChange(text);
        }}
        value={this.state.text}
        onSelectionChange={this.handleSelectionChange}
        multiline
        {...this.props.additionalTextInputProps}
      />
    );
  }
}

const AutoCompleteInputWithContext = withTranslationContext(AutoCompleteInput);
export { AutoCompleteInputWithContext as AutoCompleteInput };
