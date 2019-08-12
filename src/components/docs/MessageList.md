The MessageList component does exactly that, it renders a list of messages.

It keeps the following state:

- newMessagesNotification (true when there are new messages and you've scrolled up)
- editing (the id of the message you are editing)
- online (if you're online or not)

Here's an example of how to render a list of messages:

#### Snack example

```js
<div
  data-snack-id="@vishalnarkhede/messagelist-example"
  data-snack-platform="android"
  data-snack-preview="true"
  data-snack-theme="light"
  style={{
    overflow: 'hidden',
    background: '#fafafa',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: '4px',
    height: '505px',
    width: '100',
  }}
></div>
```
