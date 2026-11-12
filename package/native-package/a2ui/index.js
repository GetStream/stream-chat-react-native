// The A2UI renderer for the AI components' generated UI, an entry point of its own so an app whose
// agent never writes A2UI doesn't bundle the A2UI core. It draws with the AI components, whose
// entry point registers the native pieces they need.
import '../ai-components';

export * from 'stream-chat-react-native-core/a2ui';
