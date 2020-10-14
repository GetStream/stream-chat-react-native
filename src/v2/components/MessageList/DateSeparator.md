The date separator between messages.
Here's what it looks like for today.

```js
import { DateSeparator } from './DateSeparator';

import { Chat } from '../Chat/Chat';
import { client, translationContext } from '../docs/data';

const date = new Date();

<Chat client={client}>
  <DateSeparator {...translationContext} message={{ date }} />
  <DateSeparator
    {...translationContext}
    message={{ date }}
    alignment="center"
  />
  <DateSeparator
    {...translationContext}
    message={{ date }}
    alignment="left"
  />
</Chat>;
```

and for a date in the past:

```js
import { DateSeparator } from './DateSeparator';

import { Chat } from '../Chat/Chat';
import { client, translationContext } from '../docs/data';

const date = new Date('December 17, 1995 03:24:00');

<Chat client={client}>
  <DateSeparator {...translationContext} message={{ date }} />
  <DateSeparator
    {...translationContext}
    message={{ date }}
    alignment="center"
  />
  <DateSeparator
    {...translationContext}
    message={{ date }}
    alignment="left"
  />
</Chat>;
```

and adding custom date formatting:

```js
import { DateSeparator } from './DateSeparator';

import { Chat } from '../Chat/Chat';
import { client, translationContext } from '../docs/data';

const date = new Date('December 17, 1995 03:24:00');

function formatDate(d) {
  return <h2>Messages posted after {d.toDateString()}</h2>;
}

<Chat client={client}>
  <DateSeparator
    {...translationContext}
    formatDate={formatDate}
    message={{ date }}
  />
  <DateSeparator
    {...translationContext}
    formatDate={formatDate}
    message={{ date }}
    alignment="center"
  />
  <DateSeparator
    {...translationContext}
    formatDate={formatDate}
    message={{ date }}
    alignment="left"
  />
</Chat>;
```
