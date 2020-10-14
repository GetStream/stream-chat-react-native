Unread channel preview:

```js
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';

import { channelContext, message } from '../docs/data';

<ChannelPreviewMessenger
  {...channelContext}
  latestMessage={message}
  unread={10}
/>;
```

Read channel preview:

```js
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';

import { channelContext, message } from '../docs/data';

<ChannelPreviewMessenger
  {...channelContext}
  latestMessage={message}
  unread={0}
/>;
```
