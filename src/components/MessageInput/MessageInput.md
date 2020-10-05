```js
import { MessageInput } from './MessageInput';

import { Channel } from '../Channel/Channel';
import { Chat } from '../Chat/Chat';
import { channel, client } from '../docs/data';

<Chat client={client}>
    <Channel channel={channel}>
        <MessageInput />
    </Channel>
</Chat>
```