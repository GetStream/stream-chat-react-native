export * from './markdown';
export * from './syntax-highlighting';
export * from './charts';
export * from './message-composer';
export * from './StreamingMessageView';
export * from './AITypingIndicatorView';

export * from './components';

export * from './contexts';

export * from './services';
export * from './transcription/useDictation';
export { isDictationAvailable } from './native/AIDictation';

export * from './store';

export * from './theme';

// Lets the `stream-chat-react-native/ai-components` and `stream-chat-expo/ai-components` entry
// points register only the native pieces needed here, without bundling the main SDK entry point.
export { registerNativeHandlers } from '../native';
