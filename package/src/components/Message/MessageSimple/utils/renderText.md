[src/components/Message/MessageSimple/utils/renderText.ts](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/Message/MessageSimple/utils/renderText.ts)

Function that handles markdown and parsing for the text of message.

Internally it uses [react-native-simple-markdown](https://github.com/GetStream/react-native-simple-markdown#styles-1) to handle markdown.

It accepts following params:

- markdownRules { object } - <https://github.com/GetStream/react-native-simple-markdown#rules>
- markdownStyles { object } - <https://github.com/GetStream/react-native-simple-markdown#styles-1>
- message { object } Message object
