```js
import React from 'react';

import { FileUploadPreview } from './FileUploadPreview';

const fileUploads = [
  {
    id: '1',
    file: {
      uri: 'https://picsum.photos/200/300?random=1',
      name: 'File name one',
      type: 'application/msword',
    },
  },
  {
    id: '2',
    file: {
      uri: 'https://picsum.photos/200/300?random=2',
      name: 'File name two',
      type: 'application/pdf',
    },
  },
  {
    id: '3',
    file: {
      uri: 'https://picsum.photos/200/300?random=3',
      name: 'File name three',
      type: 'text/csv',
    },
  },
];

const FUPExample = () => {
  const [fileUploadsState, setFileUploadsState] = React.useState(fileUploads);

  const removeFile = (id) => {
    setFileUploadsState((prevFileUploads) => prevFileUploads.filter((file) => file.id !== id));
  };

  return (
    <FileUploadPreview
      fileUploads={fileUploadsState}
      removeFile={removeFile}
      retryUpload={() => {}}
    />
  );
};

<FUPExample />;
```
