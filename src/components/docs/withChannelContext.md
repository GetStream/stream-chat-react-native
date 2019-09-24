Any component can be made a consumer of [ChatContext](#chatcontext) by using function `withChannelContext`.

e.g.,

```json

const DemoComponentWithChannelContext =  withChannelContext(DemoComponent);

class DemoComponent extends React.Component {
    render() {
        return (
            <div>
                This is demo component with channel context
                Number of messages loaded in this channel: {this.props.messages.length}
                Number of online users: {this.props.online}
            </div>
        )
    }
}

```
