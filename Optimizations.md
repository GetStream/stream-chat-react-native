# Best practices and performance optimizations

React Native Chat SDK provides quite feature rich and performant components. But for your application, you may not need all the features that we provide and there is a room for you to add some additional optimizations. Here we have jotted down the list of things, you should take a look at - to see if you can push the performance a little further:

## Markdown

By default our message components have built in support for rendering markdown. But markdown can also comes with little performance hit, because of all the parsing that happens underneath. So if you don't need a support for markdown you can just turn it off as following:

```js
const TextComponent = ({ message }) => <Text>{message.text}</Text>;

<Channel
  channel={channel}
  MessageText={TextComponent}
>
  <MessageList />
</Channel>
```

## FlatList

- **Android specific**

  For Android, we are using this separate package (built in-house) - [flat-list-mvcp](https://github.com/GetStream/flat-list-mvcp#maintainvisiblecontentposition-prop-support-for-android-react-native), to enable bidirectional scroll on FlatList (within `MessageList` component only). Bidirectional scroll was introduced to support quoted message feature.
  Although it works fine, its still an additional wrapper around FlatList. And it comes with some small performance hit. So you if you are not using following features in your chat application, you can simply switch to using FlatList from react-native directly

  - Quoted message - Please check our docs on how to enable/disable certain message action [here](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#how-to-customize-message-actions)
  - `initialScrollToFirstUnreadMessage` prop on Channel component.

  ```js
  import { registerNativeHandlers } from 'stream-chat-react-native-core';
  import { FlatList as RNFlatList, Platform } from 'react-native';

  // This needs to be outside of your component lifecycle.
  if (Platform.OS === 'android') {
    registerNativeHandlers({
      FlatList: RNFlatList,
    })
  }
  ```

- **additionalFlatListProps**

  Its possible to provide additional props to underlying FlatList of ChannelList or Channel, via prop `additionalFlatListProps`. In this case please follow recommended guidelines by react-native - https://reactnative.dev/docs/optimizing-flatlist-configuration#avoid-anonymous-function-on-renderitem


## Props

Components in this SDK are highly customizable, through props. Whenever you add a prop, please follow following guidelines:

- Avoid anonymous functions

e.g.

```jsx
// ❌ Wrong
<Channel
  channel={channel}
  MessageStatus={() => {/** Some rendering logic */}}
>
  <MessageList />
</Channel>

// ✅ Correct
const CustomMessageStatus = () => {/** Some rendering logic */};
<Channel
  channel={channel}
  MessageStatus={CustomMessageStatus}
>
  <MessageList />
</Channel>
 >
```

- Memoize the js objects/arrays, before you passing it to chat components. This helps us in avoiding un-necessary rerenders within component hierarchy.

```js

// ❌ Wrong
<ChannelList
  filters={{
    type: 'messaging',
    members: {
      $in: [ 'vishal', 'neil', 'vir' ]
    }
  }}
/>

// ✅ Correct
const filters = useMemo(() => ({
  type: 'messaging',
  members: {
    $in: [ 'vishal', 'neil', 'vir' ]
  }
}), [ /* any hook dependencies that you may have **/ ]);

<ChannelList
  filters={filters}
/>
// Or if you have static filter, you can also move it to outside the component, to make sure reference doesn't change on subsequent re-renders.

```

Same applies for all other props:

- sort
- options
- supportedReactions
- additionalTextInputProps
- additionalFlatListProps
- ...

## Livestream applications

Livestream applications usually have to deal with most traffic, in terms of incoming messages. In such cases, its strongly adviced to turn off following features from dashboard:

- read receipts (read event)
- typing indicators (typing events)
- presence indicators (connect events)

On dashboard, you can simply toggle off events related to these features, as shown in following screenshot:

![Screenshot 2021-03-25 at 12 53 20](https://user-images.githubusercontent.com/11586388/112468911-1e0a3500-8d69-11eb-9b09-4d336a13c363.png)

## Best practices

Also we have a best practices guide for general Stream chat applications, please give it a read:
https://getstream.io/chat/docs/javascript/application_region/?language=javascript
