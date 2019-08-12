Any component can be made a consumer of [KeyboardContext](#keyboardcontext) by using function `withKeyboardContext`.

e.g.,

```json

const DemoComponentWithKeyboardContext =  withKeyboardContext(DemoComponent);

class DemoComponent extends React.Component {
    render() {
        return (
            <Button
                onPress={() => this.props.dismissKeyboard}
                title="Button to dismiss keybaord"
            />
        )
    }
}

```
