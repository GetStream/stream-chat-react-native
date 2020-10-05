```js
import { Gallery } from './Gallery';

import { Chat } from '../Chat/Chat';

const images = [
  { image_url: 'https://i.picsum.photos/id/912/200/300.jpg?blur=5&hmac=Qk9-L9x5NUPVQh1fgIM_HucJtpX2RKOAK1sLTGD-7U4' },
  { image_url: 'https://i.picsum.photos/id/1/5616/3744.jpg?hmac=kKHwwU8s46oNettHKwJ24qOlIAsWN9d2TtsXDoCWWsQ' },
  { image_url: 'https://i.picsum.photos/id/10/2500/1667.jpg?hmac=J04WWC_ebchx3WwzbM-Z4_KC_LeLBWr5LZMaAkWkF68' },
  { image_url: 'https://i.picsum.photos/id/100/2500/1656.jpg?hmac=gWyN-7ZB32rkAjMhKXQgdHOIBRHyTSgzuOK6U0vXb1w' },
  { image_url: 'https://i.picsum.photos/id/912/200/300.jpg?blur=5&hmac=Qk9-L9x5NUPVQh1fgIM_HucJtpX2RKOAK1sLTGD-7U4' },
  { image_url: 'https://i.picsum.photos/id/912/200/300.jpg?blur=5&hmac=Qk9-L9x5NUPVQh1fgIM_HucJtpX2RKOAK1sLTGD-7U4' },
];
<Chat>
  <Gallery images={images} />;
</Chat>
```
