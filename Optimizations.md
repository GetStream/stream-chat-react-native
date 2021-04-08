# Best practices and performance optimizations

React Native Chat SDK provides feature rich and performant components. But for your application, you may not need all the features that we provide and there is a room for you to add some additional optimizations. Here we have jotted down the list of things, you should take a look at - to see if you can push the performance a little further:

## Markdown

By default our message components have built in support for rendering markdown. But markdown also comes with a little performance hit, because of all the parsing that happens underneath. So if you don't need support for markdown you can just turn it off:

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

  For Android, we are using a separate package (built in-house) - [flat-list-mvcp](https://github.com/GetStream/flat-list-mvcp#maintainvisiblecontentposition-prop-support-for-android-react-native), to enable bidirectional scrolling on the FlatList component (within the `MessageList` component only). Bidirectional scrolling was introduced to support the quoted message feature.
  Although it works fine, it's still an additional wrapper around FlatList. And therefore comes with a small performance hit. So if you are not using the following features in your chat application, you can simply switch to using FlatList from react-native directly

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

  It's possible to provide additional props to the underlying FlatList of ChannelList or Channel, via the prop `additionalFlatListProps`. In this case please follow the recommended guidelines from react-native - https://reactnative.dev/docs/optimizing-flatlist-configuration#avoid-anonymous-function-on-renderitem


## Props

Components in this SDK are highly customizable through props. Whenever you add a prop, please follow the following guidelines:

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

- Memoize the js objects/arrays, before passing them into chat components. This helps us in avoiding un-necessary re-renders within the component hierarchy.

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

- theme
- sort
- options
- supportedReactions
- additionalTextInputProps
- additionalFlatListProps
- ...

## Livestream applications

Livestream applications usually have to deal with significant traffic in terms of incoming messages. In such cases, it's strongly advised to turn off the following features from the dashboard:

- read receipts (read event)
- typing indicators (typing events)
- presence indicators (connect events)

On the dashboard, you can simply toggle off events related to these features, as shown in following screenshot:

![Screenshot 2021-03-25 at 12 53 20](https://user-images.githubusercontent.com/11586388/112468911-1e0a3500-8d69-11eb-9b09-4d336a13c363.png)

## Best practices

We also have a best practices guide for general Stream Chat applications, please give it a read:
https://getstream.io/chat/docs/javascript/application_region/?language=javascript
