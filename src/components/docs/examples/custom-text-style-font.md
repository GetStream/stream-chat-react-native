# Message bubble with custom text styles/font

We use `react-native-simple-markdown` library internally in `MessageSimple` component, to render markdown
content of the text. Styling text in MessageSimple component needs a little different approach than styling
rest of the Stream chat components.

As you have already read in tutorial, to style any other component, you simply pass the theme object to Chat component, which forwards and applies styles to all the its children.

e.g.,

```js

const theme = {
  avatar: {
    image: {
      size: 32,
    },
  },
  colors: {
    primary: 'green',
  },
  // Following styles can also be provided as string directly to spinner:
  // spinner: `
  //    width: 15px;
  //    height: 15px;
  //  `
  spinner: {
    css: `
      width: 15px;
      height: 15px;
    `,
  },
  'messageInput.sendButton': 'padding: 20px',
};

<Chat client={chatClient} style={theme}>
...
</Chat>
```

To customize the styles of text, all you need to do is to add [markdown styles](https://github.com/CharlesMangwa/react-native-simple-markdown/tree/next#styles-1) to the key `message.content.markdown` of this theme object. The provided markdown styles will be forwarded to internal Markdown component

e.g.
```js
const theme = {
    'message.content.markdown': {
        // list of all avaliable options are here: https://github.com/CharlesMangwa/react-native-simple-markdown/tree/next#styles-1
        text: {
            color: 'pink',
            fontFamily: 'AppleSDGothicNeo-Bold'
        },
        url: {
            color: 'red'
        }
    }
}

<Chat client={chatClient} style={theme}>
...
</Chat>

```