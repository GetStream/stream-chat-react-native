The date separator between messages.
Here's what it looks like for today.

```js
const date = new Date();
const data = require('./data');

<React.Fragment>
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
</React.Fragment>;
```

and for a date in the past:

```js
const data = require('./data');

const date = new Date('December 17, 1995 03:24:00');
<React.Fragment>
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
</React.Fragment>;
```

and adding custom date formatting:

```js
const data = require('./data');

const date = new Date('December 17, 1995 03:24:00');

function formatDate(d) {
  return <h2>Messages posted after {d.toDateString()}</h2>;
}

<React.Fragment>
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
</React.Fragment>;
```
