import React from 'react';
import { Keyboard } from 'react-native';

export const ChannelContext = React.createContext({});
export const ChatContext = React.createContext({ client: null });

export function withChannelContext(OriginalComponent) {
  return getContextAwareComponent(ChannelContext, OriginalComponent);
}

export function withChatContext(OriginalComponent) {
  return getContextAwareComponent(ChatContext, OriginalComponent);
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
