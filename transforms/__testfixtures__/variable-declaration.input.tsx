export const withChannelContext = (
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
    const channelContext = useChannelContext<At, Ch, OtherType, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...channelContext} />;
};
