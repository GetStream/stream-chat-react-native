Send a new message button

```js
import { SendButton } from './SendButton';

<SendButton sendMessage={() => {}} />
```

Disabled send button

```js
import { SendButton } from './SendButton';

<SendButton disabled sendMessage={() => {}} />
```

Send edited message button

```js
import { SendButton } from './SendButton';

import { MessagesProvider } from '../../contexts/messagesContext/MessagesContext';

<MessagesProvider value={{ editing: true }}>
  <SendButton sendMessage={() => {}} />
</MessagesProvider>
```
