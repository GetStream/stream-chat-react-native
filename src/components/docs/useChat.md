Any component can be made a consumer of [ChatContext](#chatcontext) by using `useChat` hook if you are using react >= 16.8.

e.g.,

```json

const DemoComponent = () => {
    const { channels, channel } = useChat();
    return (
        <div>
            This is demo component with channel context
            Number of channels loaded: {channels.length}
            Id of active channel: {channel.cid}
        </div>
    );
}

```
