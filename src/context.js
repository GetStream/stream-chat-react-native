import React from 'react';
import { Keyboard } from 'react-native';

export const ChannelContext = React.createContext({});
export const ChatContext = React.createContext({ client: null });
export const KeyboardContext = React.createContext({
  dismissKeyboard: Keyboard.dismiss,
});
export const MessageContentContext = React.createContext({});
export const MessagesContext = React.createContext({});
export const SuggestionsContext = React.createContext({});
export const ThreadContext = React.createContext({});
export const TranslationContext = React.createContext({
  t: (arg) => arg || 'Value not found', // TODO: remove this little workaround when context builds out
});

export function withChannelContext(OriginalComponent) {
  return getContextAwareComponent(ChannelContext, OriginalComponent);
}

export function withChatContext(OriginalComponent) {
  return getContextAwareComponent(ChatContext, OriginalComponent);
}

export function withKeyboardContext(OriginalComponent) {
  return getContextAwareComponent(KeyboardContext, OriginalComponent);
}

export function withMessageContentContext(OriginalComponent) {
  return getContextAwareComponent(MessageContentContext, OriginalComponent);
}

export function withMessagesContext(OriginalComponent) {
  return getContextAwareComponent(MessagesContext, OriginalComponent);
}

export function withSuggestionsContext(OriginalComponent) {
  return getContextAwareComponent(SuggestionsContext, OriginalComponent);
}

export function withThreadContext(OriginalComponent) {
  return getContextAwareComponent(ThreadContext, OriginalComponent);
}

export function withTranslationContext(OriginalComponent) {
  const ContextAwareComponent = getContextAwareComponent(
    TranslationContext,
    OriginalComponent,
  );
  return ContextAwareComponent;
}

const getContextAwareComponent = function (context, originalComponent) {
  const Context = context;
  const OriginalComponent = originalComponent;
  const ContextAwareComponent = function (props) {
    return (
      <Context.Consumer>
        {(c) => <OriginalComponent {...c} {...props} />}
      </Context.Consumer>
    );
  };

  ContextAwareComponent.themePath = OriginalComponent.themePath;
  ContextAwareComponent.extraThemePaths = OriginalComponent.extraThemePaths;
  ContextAwareComponent.displayName =
    OriginalComponent.displayName || OriginalComponent.name || 'Component';
  ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace(
    'Base',
    '',
  );

  return ContextAwareComponent;
};
