A message can contain multiple attachments.
There are many types of attachments. By default the components support

- image
- video
- audio
- file

Here's an example of an image

```tsx static
import { Attachment } from 'stream-chat-react-native';
const attachment = {
  thumb_url: 'https://media3.giphy.com/media/gw3IWyGkC0rsazTi/giphy.gif',
  type: 'image',
};

function actionHandler(action) {
  console.log(action);
}

<Attachment attachment={attachment} actionHandler={actionHandler} />;
```

Or a video element:

```tsx static
import { Attachment } from 'stream-chat-react-native';

const attachment = {
  asset_url: 'https://www.youtube.com/embed/7LiyXFYaEAY',
  author_name: 'YouTube',
  image_url: 'https://i.ytimg.com/vi/7LiyXFYaEAY/maxresdefault.jpg',
  og_scrape_url: 'https://www.youtube.com/watch?v=7LiyXFYaEAY',
  title: 'Game of Thrones Season 8 Promo (HD) Final Season',
  text: 'Game of Thrones final season premieres April 14th ...',
  type: 'video',
};

function actionHandler(action) {
  console.log(action);
}

<Attachment attachment={attachment} actionHandler={actionHandler} />;
```

Image with more meta information:

```tsx static
import { Attachment } from 'stream-chat-react-native';

const attachment = {
  image_url:
    'https://images.unsplash.com/photo-1548256434-c7d2374b1077?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjEyMDd9',
  og_scrape_url: 'https://unsplash.com/photos/lxuB4abGzXc',
  text: 'Download this photo in Addu City...',
  thumb_url:
    'https://images.unsplash.com/photo-1548256434-c7d2374b1077?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjEyMDd9',
  title: 'Cosmic Home photo by Ibrahim Shabil (@shabilphotos) on Unsplash',
  title_link: 'https://unsplash.com/photos/lxuB4abGzXc',
  type: 'image',
};

function actionHandler(action) {
  console.log(action);
}

<Attachment attachment={attachment} actionHandler={actionHandler} />;
```

Attachment with actions:

```tsx static
import { View } from 'react-native';

import { Attachment } from 'stream-chat-react-native';

const attachment = {
  actions: [
    {
      name: 'image_action',
      style: 'primary',
      text: 'Send',
      type: 'button',
      value: 'send',
    },
    {
      name: 'image_action',
      style: 'default',
      text: 'Shuffle',
      type: 'button',
      value: 'shuffle',
    },
    {
      name: 'image_action',
      style: 'default',
      text: 'Cancel',
      type: 'button',
      value: 'cancel',
    },
  ],
  thumb_url: 'https://media0.giphy.com/media/3o7btXkbsV26U95Uly/giphy.gif',
  type: 'giphy',
};

function actionHandler(action) {
  console.log(action);
}
<View style={{ width: '250px' }}>
  <Attachment attachment={attachment} actionHandler={actionHandler} />
</View>;
```
