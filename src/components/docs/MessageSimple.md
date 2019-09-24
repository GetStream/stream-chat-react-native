**Examples**

Message with text content

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
  groupStyles={['single']}
  editing={false}
  style={{ 'avatar.fallback': 'background-color: red;' }}
  {...data.channelContext}
/>;
```

Message with images

```js
const data = require('./data');
<Message
  message={data.messageWithImages}
  readBy={[]}
  groupStyles={['single']}
  editing={false}
  {...data.channelContext}
/>;
```

Message with attachment

```js
const data = require('./data');
<Message
  message={data.messageWithUrlPreview}
  readBy={[]}
  groupStyles={['single']}
  editing={false}
  {...data.channelContext}
/>;
```
