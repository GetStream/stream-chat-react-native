import React from 'react';

export const ChatContext = React.createContext({ client: null });

export function withChatContext(OriginalComponent) {
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <ChatContext.Consumer>
        {(context) => {
          const mergedProps = { ...context, ...props };
          return <OriginalComponent {...mergedProps} />;
        }}
      </ChatContext.Consumer>
    );
  };
  ContextAwareComponent.displayName =
    OriginalComponent.displayName || OriginalComponent.name || 'Component';
  ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace(
    'Base',
    '',
  );

  return ContextAwareComponent;
}

export const ChannelContext = React.createContext({});

export function withChannelContext(OriginalComponent) {
  const ContextAwareComponent = function ContextComponent(props) {
    return (
      <ChannelContext.Consumer>
        {(channelContext) => (
          <OriginalComponent {...channelContext} {...props} />
        )}
      </ChannelContext.Consumer>
    );
  };
  ContextAwareComponent.displayName =
    OriginalComponent.displayName || OriginalComponent.name || 'Component';
  ContextAwareComponent.displayName = ContextAwareComponent.displayName.replace(
    'Base',
    '',
  );

  return ContextAwareComponent;
}
