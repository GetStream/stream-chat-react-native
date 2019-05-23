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
