import 'dayjs/locale/nl';

describe('StreamMediaCache', () => {
  let StreamMediaCache;
  let mockedRNFS;

  const mockRNFS = () =>
    jest.mock('react-native-fs', () => {
      const exists = jest.fn(() => Promise.resolve());
      const mkdir = jest.fn(() => Promise.resolve());
      const downloadFile = jest.fn(() => Promise.resolve());
      const unlink = jest.fn(() => Promise.resolve());

      const mocked = {
        DocumentDirectoryPath: 'directory-path',
        downloadFile,
        exists,
        mkdir,
        unlink,
      };

      mockedRNFS = mocked;

      return mocked;
    });

  beforeEach(() => {
    jest.resetModules();
    mockRNFS();
    // eslint-disable-next-line no-undef
    StreamMediaCache = require('./StreamMediaCache').default;
  });

  it('checkIfLocalAttachment - should call RNFS exists with correct arguments', async () => {
    await StreamMediaCache.checkIfLocalAttachment('channel-id', 'message-id', 'file-id');

    expect(mockedRNFS.exists).toBeCalledWith(
      'directory-path/StreamStorage/attachments/channel-id/message-id/file-id',
    );
  });

  it('checkIfLocalAvatar - should call RNFS exists with correct arguments', async () => {
    await StreamMediaCache.checkIfLocalAvatar('channel-id', 'file-id');

    expect(mockedRNFS.exists).toBeCalledWith(
      'directory-path/StreamStorage/avatars/channel-id/file-id',
    );
  });

  it('clear - should call RNFS unlink with correct arguments', async () => {
    await StreamMediaCache.clear();

    expect(mockedRNFS.unlink).toBeCalledWith('directory-path/StreamStorage');
  });

  it('getStreamChannelAvatarDir - should return correct path', () => {
    const value = StreamMediaCache.getStreamChannelAvatarDir('channel-id', 'file-id');

    expect(value).toBe('directory-path/StreamStorage/avatars/channel-id/file-id');
  });

  it('getStreamChannelMessageAttachmentDir - should return correct path', () => {
    const value = StreamMediaCache.getStreamChannelMessageAttachmentDir(
      'channel-id',
      'message-id',
      'file-id',
    );

    expect(value).toBe('directory-path/StreamStorage/attachments/channel-id/message-id/file-id');
  });

  it('removeChannelAttachments - should call unlink with correct arguments', async () => {
    await StreamMediaCache.removeChannelAttachments('channel-id');

    expect(mockedRNFS.unlink).toBeCalledWith('directory-path/StreamStorage/attachments/channel-id');
  });

  it('removeChannelAvatars - should call unlink with correct arguments', async () => {
    await StreamMediaCache.removeChannelAvatars('channel-id');

    expect(mockedRNFS.unlink).toBeCalledWith('directory-path/StreamStorage/avatars/channel-id');
  });

  it('removeMessageAttachments - should call unlink with correct arguments', async () => {
    await StreamMediaCache.removeMessageAttachments('channel-id', 'message-id');

    expect(mockedRNFS.unlink).toBeCalledWith(
      'directory-path/StreamStorage/attachments/channel-id/message-id',
    );
  });

  it('saveAttachment - should call downloadFile with correct arguments', async () => {
    await StreamMediaCache.saveAttachment(
      'channel-id',
      'message-id',
      'file-id',
      'https://file-here.com/file',
    );

    expect(mockedRNFS.downloadFile).toBeCalledWith({
      fromUrl: 'https://file-here.com/file',
      toFile: 'directory-path/StreamStorage/attachments/channel-id/message-id/file-id',
    });
  });

  it('saveAvatar - should call downloadFile with correct arguments', async () => {
    await StreamMediaCache.saveAvatar('channel-id', 'file-id', 'https://file-here.com/file');

    expect(mockedRNFS.downloadFile).toBeCalledWith({
      fromUrl: 'https://file-here.com/file',
      toFile: 'directory-path/StreamStorage/avatars/channel-id/file-id',
    });
  });
});
