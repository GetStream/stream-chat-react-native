export type ChannelContextValue = {
  channel: Channel<StreamChatClient>;
  members: ChannelState<StreamChatClient>['members'];
  read: ChannelState<StreamChatClient>['read'];
  watchers: ChannelState<StreamChatClient>['watchers'];
  watcherCount?: ChannelState<StreamChatClient>['watcher_count'];
};

export const ChannelProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelContextValue<StreamChatClient>;
}>) => (
  <ChannelContext.Provider value={value as unknown as ChannelContextValue}>
    {children}
  </ChannelContext.Provider>
);

export const useChannelContext = () =>
    useContext(ChannelContext) as unknown as ChannelContextValue<StreamChatClient>;

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChannelContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelContext = (
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChannelContextValue<StreamChatClient>>> => {
  const WithChannelContextComponent = (
    props: Omit<P, keyof ChannelContextValue<StreamChatClient>>,
  ) => {
    return <Component {...(props as P)} {...channelContext} />;
  };
  WithChannelContextComponent.displayName = `WithChannelContext${getDisplayName(Component)}`;
  return WithChannelContextComponent;
};
