Please check the `ImageGalleryContextValue` in [ImageGalleryContext](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/imageGalleryContext/ImageGalleryContext.tsx), for consumable values.
Provider for this context exists in `OverlayProvider` component. And so, any child component of OverlayProvider
can get access to context as following:

- Functional component

```tsx static
import { useChannelsContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { selectedMessage, setSelectedMessage, setMessages } = useImageGalleryContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withChannelsContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.image);
    console.log(props.setImage);
    console.log(props.setImages);
  }

  // UI Logic
}

export withImageGalleryContext(SomeChildComponent);
```
