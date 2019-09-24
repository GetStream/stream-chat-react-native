```js
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

class IUPExample extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileUploads,
    };

    this.removeFile = this.removeFile.bind(this);
  }

  removeFile(id) {
    this.setState({
      fileUploads: this.state.fileUploads.filter((obj) => obj.id !== id),
    });
  }

  render() {
    return (
      <FileUploadPreview
        fileUploads={this.state.fileUploads}
        removeFile={this.removeFile}
        retryUpload={() => {}}
      />
    );
  }
}

<IUPExample />;
```
