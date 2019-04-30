Card style layout for displaying links. For different message styles, we customized this component with css.

```js
const url = 'https://www.google.com/';
const image_url =
  'https://www.google.com/logos/doodles/2015/googles-new-logo-5078286822539264.3-hp2x.gif';

<div className="str-chat" style={{ height: 'unset' }}>
  <Card
    title={'Google'}
    text={'A search engine'}
    image_url={image_url}
    title_link={url}
  />
</div>;
```
