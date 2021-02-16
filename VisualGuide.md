# Visual guide for customizing components

We have prepare this doc to make things easy around component customization. You can replace any of the default components by providing prop either on OverlayProvider or Channel or ChannelList, depending on which component you are customizing. You can find which parent component needs to consume this prop, at bottom of screenshots.

e.g, looking at [1st slide](#channel-list-components), if you decide to replace default `PreviewMessage` component, you can do it as following:

```jsx

// To remove the component
<ChannelList PreviewMessage={() => null}>

// To add custom UI
<ChannelList PreviewMessage={({ channel }) => {
    const latestMessage = channel.state.messages[channel.state.messages.length - 1];

    return <Text>{latestMessage.text}</Text>
}}>
```

While using custom component, you can access most of the necessary information available on props. Additionally, you can access values available on contexts that we use within this SDK.

e.g., 

```jsx
import { ChannelList, useChannelsContext } from 'stream-chat-react-native';

<ChannelList PreviewMessage={({ channel }) => {
    const latestMessage = channel.state.messages[channel.state.messages.length - 1];
    const { channels } = useChannelsContext();

    // console.log('Number of channels in list - ', channels.length);
    return <Text>{latestMessage.text}</Text>
}}>
```

We provide following hooks to access context values. Please check the list of all available contexts here: https://getstream.github.io/stream-chat-react-native/#section-contexts

## Channel list components

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/1.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>

---

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/2.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>


## Input and Attachment picker components

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/3.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>

---

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/4.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>


## Message overlay components

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/5.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>

## Gallery components

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/6.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>

---

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/7.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>

## Message list component

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/8.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>

## Attachment component

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/9.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>

## Message component

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/10.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>

## Thread component

<div>
    <img src="https://github.com/GetStream/stream-chat-react-native/blob/vishal/v2-designs-docs/screenshots/visualGuide/11.svg" alt="IMAGE ALT TEXT HERE" width="100%" border="1" style="margin-top: 20px" />
</div>







