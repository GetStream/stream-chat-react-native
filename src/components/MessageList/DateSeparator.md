The date separator between messages.
Here's what it looks like for today.

```js
const date = new Date();
const data = require('../docs/data');

<Chat client={data.client}>
  <DateSeparator {...data.translationContext} message={{ date }} />
  <DateSeparator
    {...data.translationContext}
    message={{ date }}
    alignment="center"
  />
  <DateSeparator
    {...data.translationContext}
    message={{ date }}
    alignment="left"
  />
</Chat>;
```

and for a date in the past:

```js
const data = require('../docs/data');

const date = new Date('December 17, 1995 03:24:00');
<Chat client={data.client}>
  <DateSeparator {...data.translationContext} message={{ date }} />
  <DateSeparator
    {...data.translationContext}
    message={{ date }}
    alignment="center"
  />
  <DateSeparator
    {...data.translationContext}
    message={{ date }}
    alignment="left"
  />
</Chat>;
```

and adding custom date formatting:

```js
const data = require('../docs/data');

const date = new Date('December 17, 1995 03:24:00');

function formatDate(d) {
  return <h2>Messages posted after {d.toDateString()}</h2>;
}

<Chat client={data.client}>
  <DateSeparator
    {...data.translationContext}
    formatDate={formatDate}
    message={{ date }}
  />
  <DateSeparator
    {...data.translationContext}
    formatDate={formatDate}
    message={{ date }}
    alignment="center"
  />
  <DateSeparator
    {...data.translationContext}
    formatDate={formatDate}
    message={{ date }}
    alignment="left"
  />
</Chat>;
```
