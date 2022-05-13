Please check the `PaginatedMessageListContextValue` in [PaginatedMessageListContext](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/paginatedMessageListContext/PaginatedMessageListContext.tsx), for consumable values.
Provider for this context exists in `Channel` component. And so, any child component of Channel
can get access to context as following:

- Functional component

```tsx static
import { usePaginatedMessageListContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { loadMore, loadingMore, loadMoreRecent, loadingMoreRecent } = usePaginatedMessageListContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withPaginatedMessageListContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.loadMore);
    console.log(props.loadMoreRecent);
  }

  // UI Logic
}
