Message input component supports suggestions feature. Suggestions are displayed using the popup which contains a list of suggestion items.
All the functionality is abstracted out to a higher order component called [SuggestionsProvider](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/SuggestionsProvider.js). This HOC provides a context containing following functions to underlying components which consume this context:

- **setInputBoxContainerRef** Function to set ref on input box container.
- **openSuggestions** Opens the suggestions popup on input box (whose ref is set by setInputBoxContainerRef)

  **Params**

  - `title` {string} Title/header for suggestions suggestions popup
  - `component` A UI component to be used as item in suggestions list. It should be either functional component or react class component.

- **closeSuggestions** Closes the suggestions popup on input box (whose ref is set by setInputBoxContainerRef)
- **updateSuggestions** Updates the suggestions in suggestions popup.

  **Params**

  - `suggestions` {array} Array of suggestion objects

    Example of suggestion object:

    ```json
        {
            data: [
                'suggestion 1',
                'suggestion 2',
                'suggestion 3',
                ...
            ],
            onSelect: (suggestionItem) => { ... },
        }
    ```
