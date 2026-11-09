// A missing module is a mock whose factory throws, as `require` does for a package that isn't installed.
const mockOptionalModule = (name: string, exports?: object) =>
  jest.doMock(
    name,
    () => {
      if (!exports) {
        throw new Error(`Cannot find module '${name}'`);
      }
      return exports;
    },
    { virtual: true },
  );

const audioLibraryLogsOnLoad = () => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  require('../Sound');
  return log.mock.calls
    .flat()
    .filter((message) => typeof message === 'string' && message.includes('audio library'));
};

describe('expo Sound', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('asks for no audio library when only expo-audio is installed', () => {
    mockOptionalModule('expo-audio', { AudioModule: {}, createAudioPlayer: jest.fn() });
    mockOptionalModule('expo-av');

    expect(audioLibraryLogsOnLoad()).toEqual([]);
  });

  it('asks for no audio library when only expo-av is installed', () => {
    mockOptionalModule('expo-audio');
    mockOptionalModule('expo-av', { Audio: {} });

    expect(audioLibraryLogsOnLoad()).toEqual([]);
  });

  it('asks for expo-audio when no audio library is installed', () => {
    mockOptionalModule('expo-audio');
    mockOptionalModule('expo-av');

    expect(audioLibraryLogsOnLoad()).toEqual([expect.stringContaining('"expo-audio"')]);
  });
});
