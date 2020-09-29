```js
const imageUploads = [
  {
    id: '1',
    file: {
      uri: 'https://picsum.photos/200/300?random=1',
    },
  },
  {
    id: '2',
    file: {
      uri: 'https://picsum.photos/200/300?random=2',
    },
  },
  {
    id: '3',
    file: {
      uri: 'https://picsum.photos/200/300?random=3',
    },
  },
];

const IUPExample = () => {
  const [imageUploadsState, setImageUploadsState] = React.useState(imageUploads);

  const removeImage = (id) => {
    setImageUploadsState((prevImageUploads) => prevImageUploads.filter((image) => image.id !== id));
  };

  return (
    <ImageUploadPreview
      imageUploads={imageUploadsState}
      removeImage={removeImage}
    />
  );
};

<IUPExample />;
```
