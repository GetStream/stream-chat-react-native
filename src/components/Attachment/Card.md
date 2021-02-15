Card style layout for displaying links. For different message styles, we customized this component with css.

```tsx static
import { View } from 'react-native';

import { Card } from 'stream-chat-react-native';

const url = 'https://www.google.com/';
const image_url =
  'https://www.google.com/logos/doodles/2015/googles-new-logo-5078286822539264.3-hp2x.gif';

<Card
  image_url={image_url}
  text={'A search engine'}
  title={'Google'}
  title_link={url}
/>
```
