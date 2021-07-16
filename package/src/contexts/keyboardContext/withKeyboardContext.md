Any component can be made a consumer of [KeyboardContext](#keyboardcontext) by using function `withKeyboardContext`.

e.g.,

```js static
import { Button } from 'react-native';

import { withKeyboardContext } from './KeyboardContext';

const DemoComponentWithKeyboardContext = withKeyboardContext(DemoComponent);

const DemoComponent = (props) => (
  <Button
    onPress={props.dismissKeyboard}
    title='Button to dismiss keyboard'
  />
);
```
