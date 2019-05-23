```js
const imageUploads = [
  {
    id: 1,
    file: {
      uri:
        'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
    },
  },
  {
    id: 2,
    file: {
      uri:
        'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
    },
  },
  {
    id: 3,
    file: {
      uri:
        'https://4.img-dpreview.com/files/p/E~TS590x0~articles/3925134721/0266554465.jpeg',
    },
  },
];

class IUPExample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageUploads,
    };

    this.removeImage = this.removeImage.bind(this);
  }

  removeImage(id) {
    this.setState({
      imageUploads: this.state.imageUploads.filter((obj) => obj.id !== id),
    });
  }

  render() {
    return (
      <ImageUploadPreview
        imageUploads={this.state.imageUploads}
        removeImage={this.removeImage}
      />
    );
  }
}

<IUPExample />;
```
