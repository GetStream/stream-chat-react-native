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

We use [markdown](https://github.com/CharlesMangwa/react-native-simple-markdown) to render the text in message.

You can customize the styles of message text by providing custom styles in theme object:

Available options for customization are: https://github.com/CharlesMangwa/react-native-simple-markdown/tree/next#styles-1

```json
const theme = {
  message: {
    content: {
      markdown: {
        text: {
          fontFamily: 'AppleSDGothicNeo-Bold'
        },
        link: {
          color: 'pink'
        }
      }
    }
  }
}

...
<Chat client={client} style={theme}>
  ...
</Chat>
```
