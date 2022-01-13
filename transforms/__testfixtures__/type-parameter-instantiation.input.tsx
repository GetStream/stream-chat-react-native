export type ChannelContextValue = {
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  members: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['members'];
  read: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['read'];
  watchers: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watchers'];
  watcherCount?: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['watcher_count'];
};

export const ChannelProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ChannelContext.Provider value={value as unknown as ChannelContextValue}>
    {children}
  </ChannelContext.Provider>
);

export const useChannelContext = () =>
    useContext(ChannelContext) as unknown as ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>;

/**
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withChannelContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withChannelContext = (
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithChannelContextComponent = (
    props: Omit<P, keyof ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    return <Component {...(props as P)} {...channelContext} />;
  };
  WithChannelContextComponent.displayName = `WithChannelContext${getDisplayName(Component)}`;
  return WithChannelContextComponent;
};
