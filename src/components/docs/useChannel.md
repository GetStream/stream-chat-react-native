Any component can be made a consumer of [ChatContext](#chatcontext) by using `useChannel` hook if you are running react >= 16.8.

e.g.,

```json

const DemoComponent = () => {
    const { online, messages } = useChannel();
    return (
        <div>
            This is demo component with channel context
            Number of messages loaded in this channel: {messages.length}
            Number of online users: {online}
        </div>
    );
}

```
