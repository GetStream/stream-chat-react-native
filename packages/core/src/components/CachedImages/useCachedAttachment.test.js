import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const defaultConfig = {
  cacheConfig: { channelId: 'channel-id', messageId: 'message-id' },
  source: { uri: 'https://image-here.com/media/file-id' },
};

describe('useCachedAttachment', () => {
  let mockedStreamMediaCache;
  let TestComponent;
  let componentCB;

  const mockStreamCache = (shouldCacheMedia = true) =>
    jest.mock('../../StreamCache', () => ({
      StreamCache: { shouldCacheMedia: jest.fn(() => shouldCacheMedia) },
    }));

  const mockRNFS = () =>
    jest.mock('react-native-fs', () => ({
      DocumentDirectoryPath: 'directory-path',
    }));

  const mockStreamMediaCache = (checkIfLocalValue = true) =>
    jest.mock('../../StreamMediaCache', () => {
      const mocked = {
        checkIfLocalAttachment: jest.fn(() => Promise.resolve(checkIfLocalValue)),
        getStreamChannelMessageAttachmentDir: jest.fn((...params) => params.join('/')),
        saveAttachment: jest.fn(() => Promise.resolve()),
      };

      mockedStreamMediaCache = mocked;

      return mocked;
    });

  const resetHookComponent = (cb) => {
    // workaround for https://github.com/facebook/jest/issues/8987
    jest.isolateModules(() => {
      // eslint-disable-next-line no-undef
      const { useCachedAttachment } = require('./useCachedAttachment');

      TestComponent = ({ config }) => {
        const cachedSource = useCachedAttachment(config);

        cb(cachedSource);

        return null;
      };
    });
  };

  beforeEach(() => {
    componentCB = jest.fn();

    mockStreamCache();
    mockRNFS();
    mockStreamMediaCache();
    resetHookComponent(componentCB);
  });

  it('should return correct source object', async () => {
    render(<TestComponent config={defaultConfig} />);

    await waitFor(() => {
      expect(componentCB).toHaveBeenCalledWith({ uri: '' });
      expect(componentCB).toHaveBeenCalledWith({
        uri: 'file://channel-id/message-id/image-here.com___media___file-id',
      });
    });
  });

  it('should save image its not cached already', async () => {
    componentCB = jest.fn();

    mockStreamCache();
    mockRNFS();
    mockStreamMediaCache(false);
    resetHookComponent(componentCB);

    render(<TestComponent config={defaultConfig} />);

    await waitFor(() => {
      expect(mockedStreamMediaCache.saveAttachment).toHaveBeenCalledWith(
        'channel-id',
        'message-id',
        'image-here.com___media___file-id',
        'https://image-here.com/media/file-id',
      );
      expect(componentCB).toHaveBeenCalledWith({ uri: '' });
      expect(componentCB).toHaveBeenCalledWith({
        uri: 'file://channel-id/message-id/image-here.com___media___file-id',
      });
    });
  });

  it('should strip query parameters', async () => {
    componentCB = jest.fn();

    mockStreamCache();
    mockRNFS();
    mockStreamMediaCache(false);
    resetHookComponent(componentCB);

    render(
      <TestComponent
        config={{
          ...defaultConfig,
          source: { uri: 'https://image-here.com/media/file-id?q=test' },
        }}
      />,
    );

    await waitFor(() => {
      expect(mockedStreamMediaCache.saveAttachment).toHaveBeenCalledWith(
        'channel-id',
        'message-id',
        'image-here.com___media___file-id',
        'https://image-here.com/media/file-id?q=test',
      );
      expect(componentCB).toHaveBeenCalledWith({ uri: '' });
      expect(componentCB).toHaveBeenCalledWith({
        uri: 'file://channel-id/message-id/image-here.com___media___file-id',
      });
    });
  });

  it('should use regular image when cache is disabled', async () => {
    componentCB = jest.fn();

    mockStreamCache(false);
    mockRNFS();
    mockStreamMediaCache();
    resetHookComponent(componentCB);

    render(<TestComponent config={defaultConfig} />);

    await waitFor(() => {
      expect(componentCB).not.toHaveBeenCalledWith({ uri: '' });
      expect(componentCB).toHaveBeenCalledWith({ uri: 'https://image-here.com/media/file-id' });
    });
  });
});
