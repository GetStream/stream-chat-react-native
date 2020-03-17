import React from 'react';

export const ChatContext = React.createContext({ client: null });

export function withChatContext(OriginalComponent) {
  const ContextAwareComponent = getContextAwareComponent(
    ChatContext,
    OriginalComponent,
  );
  return ContextAwareComponent;
}

export const TranslationContext = React.createContext({
  t: () => 'Value not found',
});

export function withTranslationContext(OriginalComponent) {
  const ContextAwareComponent = getContextAwareComponent(
    TranslationContext,
    OriginalComponent,
  );
  return ContextAwareComponent;
}

export const ChannelContext = React.createContext({});

export function withChannelContext(OriginalComponent) {
  const ContextAwareComponent = getContextAwareComponent(
    ChannelContext,
    OriginalComponent,
  );
  return ContextAwareComponent;
}

export const SuggestionsContext = React.createContext({});

export function withSuggestionsContext(OriginalComponent) {
  return getContextAwareComponent(SuggestionsContext, OriginalComponent);
}

export const MessageContentContext = React.createContext({});

export function withMessageContentContext(OriginalComponent) {
  return getContextAwareComponent(MessageContentContext, OriginalComponent);
}

export const KeyboardContext = React.createContext({});

export function withKeyboardContext(OriginalComponent) {
  return getContextAwareComponent(KeyboardContext, OriginalComponent);
}

const getContextAwareComponent = function(context, originalComponent) {
  const Context = context;
  const OriginalComponent = originalComponent;
  const ContextAwareComponent = function(props) {
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
