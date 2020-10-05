Simple default LoadingIndicator

```js
import { LoadingIndicator } from './LoadingIndicator';

import { Chat } from '../Chat/Chat';
import { client } from '../docs/data';

<Chat client={client}>
    <LoadingIndicator />
</Chat>
```

Channel LoadingIndicator

```js
import { LoadingIndicator } from './LoadingIndicator';

import { Chat } from '../Chat/Chat';
import { client } from '../docs/data';

<Chat client={client}>
    <LoadingIndicator listType='channel' />
</Chat>
```

Message LoadingIndicator

```js
import { LoadingIndicator } from './LoadingIndicator';

import { Chat } from '../Chat/Chat';
import { client } from '../docs/data';

<Chat client={client}>
    <LoadingIndicator listType='message' />
</Chat>
```
