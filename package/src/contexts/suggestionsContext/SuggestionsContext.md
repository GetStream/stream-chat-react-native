The MessageInput component supports a suggestions feature. Suggestions are displayed using a popup which contains a list of the suggestion items. All functionality is saved in the SuggestionsContext and can be accessed through the [SuggestionsProvider](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/suggestionsContext/SuggestionsContext.tsx) higher order component. This HOC provides the following functions to its underlying child components:

- **closeSuggestions** {function} Closes the suggestions popup above the input box
- **openSuggestions** {function} Opens the suggestions popup above the input box

  **Params:**

  - **title:** Title for the suggestions popup
  - **component:** UI component used to display each item in the suggestions list
- **setInputBoxContainerRef** {function} Sets a ref on the text input box container
- **updateSuggestions** {function} Updates the suggestions in the suggestions popup

  **Params:**

  - **suggestions:** Array of suggestion objects

  **Example:**

  ```json
  {
    data: [
      'suggestion 1',
      'suggestion 2',
      'suggestion 3',
    ],
    onSelect: (suggestionItem) => { ... }
  }
  ```
