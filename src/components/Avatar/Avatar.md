The default circle style Avatar

```js
import { Avatar } from './Avatar';

const image =
  'https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg';
const name = 'uthred';

<Avatar image={image} name={name} size={35} />;
```

An example of how the fallback looks

```js
import { Avatar } from './Avatar';

const name = 'username';

<Avatar name={name} size={35} />;
```
