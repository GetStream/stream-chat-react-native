The default circle style Avatar

```tsx static
import { Avatar } from 'stream-chat-react-native';

const image =
  'https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg';
const name = 'uthred';

<Avatar image={image} name={name} size={35} />;
```

An example of how the fallback looks

```tsx static
import { Avatar } from 'stream-chat-react-native';

const name = 'username';

<Avatar name={name} size={35} />;
```
