AttachmentActions renders the attachment action

Style info

```tsx static
import { AttachmentActions } from './AttachmentActions';

function actionHandler(action) {
  console.log(action);
}

const actions = [
  // style can be default, primary or danger
  { name: 'Blue', value: 'blue', style: 'primary', text: 'Blue' },
  { name: 'Green', value: 'green', style: 'default', text: 'Green' },
  { name: 'Orange', value: 'orange', style: 'danger', text: 'Orange' },
];

<AttachmentActions
  id={1}
  text={'Pick a color'}
  actions={actions}
  actionHandler={actionHandler}
/>;
```

```tsx static
import { AttachmentActions } from './AttachmentActions';

function actionHandler(action) {
  console.log(action);
}

const actions = [
  // style can be default, primary or danger
  { name: 'Black', value: 'black', style: 'primary', text: 'Black' },
  { name: 'Green', value: 'green', style: 'default', text: 'Green' },
  { name: 'Orange', value: 'orange', style: 'danger', text: 'Orange' },
];

<AttachmentActions
  id={1}
  text={'Pick a color'}
  actions={actions}
  actionHandler={actionHandler}
  style={{
    button: { primaryBackgroundColor: 'black' },
    buttonText: {
      fontSize: 30,
    },
  }}
/>;
```
