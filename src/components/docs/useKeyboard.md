Any component can be made a consumer of [KeyboardContext](#keyboardcontext) by using `useKeyboard` hook if you are using react >= 16.8.

e.g.,

```json

const DemoComponent = () => {
    const { dismissKeyboard } = useKeyboard();
    return (
        <Button
            onPress={() => dismissKeyboard()}
            title="Button to dismiss keybaord"
        />
    );
}

```
