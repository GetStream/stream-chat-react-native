// primitives
export * from './markdown';
export * from './syntax-highlighting';
export * from './charts';
export * from './message-composer';
export * from './StreamingMessageView';
export * from './AITypingIndicatorView';

// components
export * from './components';

// contexts
export * from './contexts';

// services
export * from './services';
export * from './transcription/useDictation';
export { isDictationAvailable } from './native/AIDictation';

// state-stores
export * from './store';

// theme
export * from './theme';

// Native handler registration, used by the `stream-chat-react-native/ai-components` and
// `stream-chat-expo/ai-components` entry points to register only the native pieces this entry
// point needs (without importing, and therefore bundling, the main SDK entry point).
export { registerNativeHandlers } from '../native';
