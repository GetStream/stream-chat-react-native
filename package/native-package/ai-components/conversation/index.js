// The AI conversation, an entry point of its own because it needs react-native-keyboard-controller,
// which the rest of the AI components don't. It draws with the AI components, whose entry point
// registers the native pieces they need.
import '..';

export * from 'stream-chat-react-native-core/ai-components/conversation';
