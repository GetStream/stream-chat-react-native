# Different customizations of Stream chat components

## Message components/bubble

`MessageList` component accepts `Message` prop, where you can mention or provide custom message (UI) component.
You can use built-in component as it is, but every product requires its own functionality/behaviour and styles.
For this you can either build your own component or you can also use in-built components with some modifications.

Here I am going to build some custom components, which use in-built components underneath with some modifications to its props.
All the props accepted by MessageSimple component are mentioned here - https://getstream.github.io/stream-chat-react-native/#messagesimple

Then all you need to do is to pass this component to MessageList component:

e.g.,

```js
<Chat client={chatClient}>
  <Channel>
    <MessageList Message={MessageSimpleModified} />
    <MessageInput />
  </Channel>
</Chat>
```

- [Show alert box with confirm/cancel buttons when message is deleted.](alert-on-delete.md)

- [Message bubble with custom text styles/font](custom-text-style-font.md)

- [Custom/different style for received and sent messages](different-styles-for-sent-&-received-message.md)

- [Message with custom reactions](custom-reactions.md)

- [Instagram style double-tap reaction](ig-style-double-tap.md)

- [Message bubble with reactions at bottom of message](reactions-at-bottom-of-message.md)

- [Slack style - all the messages on left side ](slack-style-messages-on-left-side.md)

- [Message bubble with name of sender ](message-with-username.md)

_**in progress ...**_
## Actionsheet

Internally we use [react-native-actionsheet](https://github.com/beefe/react-native-actionsheet) library. This library supports style customizations.
But used our own components for header and actionsheet. So some basic styling could be done using theme object (provided to Chat component)

We use actionsheet at two places in our library.

### Message actions
_(to display list of message options, when message is long pressed - in `MessageContent` component inside `MessageSimple`)_

Basic styling can be achieved by providing styles for keys given in following example, in theme object.

```js
const theme = {
  'messageInput.actionSheet.titleContainer': `background-color: 'black', padding: 10px`,
  'messageInput.actionSheet.titleText': `color: 'white'`
  'messageInput.actionSheet.buttonContainer': `background-color: 'black', padding: 5px`,
  'messageInput.actionSheet.buttonText': `color: 'white', margin-left: 20px`
}

<Chat client={chatClient} style={theme}></Chat>
```
If you want to customize further, e.g., container of the whole actionsheet or backdrop, then you need to add styles directly for
internal react-native-actionsheet component. You can do that by passing prop `actionSheetStyles` to MessageInput component.

_Full list of options: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js_

```js
import { Chat, Channel, MessageList, MessageInput, MessageSimple } from 'stream-chat-react-native';

const actionsheetStyles = {
  overlay: {
    backgroundColor: 'grey',
    opacity: 0.6
  },
  wrapper: {
    flex: 1,
    flexDirection: 'row'
  },
};

<Chat client={chatClient}>
  <Channel>
    <MessageList />
    <MessageInput actionsheetStyles={actionsheetStyles} />
  </Channel>
</Chat>
```

**Note** `titleBox`, `titleText`, `buttonBox` and `buttonText` won't work in above styles, since we have overriden those components with our own components.

### MessageInput attachments
_(attachment options, when `+` icon is pressed in MessageInput component.)_

Basic styling can be achieved by providing styles for keys given in following example, in theme object.

```js
const theme = {
  'message.actionSheet.titleContainer': `background-color: 'black', padding: 10px`,
  'message.actionSheet.titleText': `color: 'white'`,
  'message.actionSheet.buttonContainer': `background-color: 'black', padding: 10px`,
  'message.actionSheet.buttonText': `color: 'white'`,
  'message.actionSheet.cancelButtonContainer': `background-color: 'red', padding: 10px`,
  'message.actionSheet.cancelButtonText': `color: 'white'`,
};

<Chat client={chatClient} style={theme}></Chat>
```
If you want to customize further, e.g., container of the whole actionsheet or backdrop, then you need to add styles directly for
internal react-native-actionsheet component. You can do that by passing prop `actionSheetStyles` to `MessageSimple` component.

_Full list of options: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js_

```js
import { Chat, Channel, MessageList, MessageInput, MessageSimple } from 'stream-chat-react-native';

const actionsheetStyles = {
  overlay: {
    backgroundColor: 'grey',
    opacity: 0.6
  },
  wrapper: {
    flex: 1,
    flexDirection: 'row'
  },
};

const MessageSimpleWithCustomActionsheet = props => (
  <MessageSimple
    {...props}
    actionsheetStyles={actionsheetStyles} />
  )}
);

// When you render chat components ...
<Chat client={chatClient}>
  <Channel>
    <MessageList Message={MessageSimpleWithCustomActionsheet} />
    <MessageInput/>
  </Channel>
</Chat>

```

## Keyboard

React native provides an in built component called `KeyboardAvoidingView`. This component works well for most of the cases where height of the component is 100% relative to screen. If you have some fixed height then it may create some issue (it depends on your case - how you use wrappers around chat components).

To avoid this issue we built our own component - `KeyboardCompatibleView`. It contains simple logic - when keyboard is opened (which we can know from events of `Keyboard` module), adjust the height of Channel component and when keyboard is dismissed, then again adjust the height of Channel component accordingly. While building this component, we realized that it has certain limitations. e.g., Keyboard module on emits the event keyboardDidHide, which means we can only adjust the height of Channel component after dismissal of keyboard has already started (which results in white gap between keyboard and Channel component during keyboard dismissal)

There are few customizations you can do regarding the keyboard behaviour (min required sdk version - `0.6.6`)

### Changing the animation duration/time of height adjustment of MessageList

You can pass the custom component as prop - `KeyboardCompatibleView` to channel component. Add the custom animation duration
to `KeyboardCompatibleView` using props `keyboardDismissAnimationDuration` and `keyboardOpenAnimationDuration`, and pass it to `Channel` component (as done in following example):

```js
import { KeyboardCompatibleView } from 'stream-chat-react-native';

const CustomizedKeyboardView = props => (
  <KeyboardCompatibleView keyboardDismissAnimationDuration={200} keyboardOpenAnimationDuration={200}>
    {props.children}
  </KeyboardCompatibleView>
)

// When you render the chat component
<Chat client={chatClient}>
  <Channel
    KeyboardCompatibleView={CustomizedKeyboardView}
    ...
  />
</Chat>
```

### Disable KeyboardCompatibleView and use KeyboardAvoidingView from react-native

You can disable `KeyboardCompatibleView` by using prop `disableKeyboardCompatibleView` on `Channel` component.

Following example shows how to use `KeyboardAvoidingView` instead:

```js static
<SafeAreaView>
  <Chat client={chatClient}>
    // Note: Android and iOS both interact with `padding` prop differently.
    // Android may behave better when given no behavior prop at all, whereas iOS is the opposite.
    // reference - https://reactnative.dev/docs/keyboardavoidingview#behavior
    <KeyboardAvoidingView behavior="padding">
      <View style={{display: 'flex', height: '100%'}}>
        <Channel channel={channel} disableKeyboardCompatibleView>
          <MessageList />
          <MessageInput />
        </Channel>
      </View>
    </KeyboardAvoidingView>
  </Chat>
</SafeAreaView>
```
