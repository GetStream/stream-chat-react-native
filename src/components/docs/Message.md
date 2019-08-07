The Message component is the high level component that deals with all the message logic.
It doesn't implement any rendering, but delegates that to the Message prop.

The Message component provides the following functions to the rendered component:

- **isMyMessage** returns true if message belongs to current user, else false

  **Params**

  - `message`

- **isAdmin** returns true if current user has admin role.
- **canEditMessage** returns true if current user has permission to edit message.
- **canDeleteMessage** returns true if current user has permission to edit message.
- **handleFlag** Handler to flag a message
- **handleMute** Handler to mute a user of message
- **handleEdit** Handler to edit a message
- **handleDelete** Handler to delete a message
- **handleReaction** Handler to add/remove reaction on message
- **handleAction** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
- **handleRetry** Handler to resend the message, in case of failure.
- **openThread** Handler to open the thread on current message.

```js
const data = require('./data');
<Message
  message={data.message}
  readBy={[]}
  groupStyles={['top']}
  editing={false}
  {...data.channelContext}
/>;
```

Use the team messaging render component and set readBy

```js
const data = require('./data');

const readBy = [
  {
    created_at: '2019-03-11T15:13:05.441436Z',
    id: 'Jaapusenameinsteadplz',
    image:
      'https://www.gettyimages.com/gi-resources/images/CreativeLandingPage/HP_Sept_24_2018/CR3_GettyImages-159018836.jpg',
    last_active: '2019-04-02T11:11:13.188618462Z',
    name: 'Jaap',
    online: true,
    updated_at: '2019-04-02T11:11:09.36867Z',
  },
];

<Message
  message={data.message}
  readBy={readBy}
  groupStyles={['bottom']}
  editing={false}
  style={{ 'avatar.fallback': 'background-color: red;' }}
  {...data.channelContext}
/>;
```
