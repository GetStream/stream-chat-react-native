describe('native compressImage', () => {
  const createResizedImage = jest.fn();

  const loadHandler = () => {
    // `__esModule: true` matters: the handler uses a default import, so Babel runs the mock
    // through _interopRequireDefault, which would double-wrap a plain `{ default }` object.
    jest.doMock('../../native', () => ({
      __esModule: true,
      default: { createResizedImage },
    }));

    return require('../compressImage').compressImage as (params: {
      backgroundColor?: string | number | null;
      compressImageQuality: number;
      height: number;
      uri: string;
      width: number;
    }) => Promise<string>;
  };

  beforeEach(() => {
    createResizedImage.mockResolvedValue({ uri: 'file:///cache/out.JPEG' });
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('forwards the background colour through to the native resizer', async () => {
    const compressImage = loadHandler();

    await expect(
      compressImage({
        backgroundColor: '#FFFFFF',
        compressImageQuality: 0.5,
        height: 900,
        uri: 'file:///in.png',
        width: 1200,
      }),
    ).resolves.toBe('file:///cache/out.JPEG');

    expect(createResizedImage).toHaveBeenCalledWith(
      'file:///in.png',
      1200,
      900,
      'JPEG',
      50,
      0,
      undefined,
      { backgroundColor: '#FFFFFF', mode: 'cover' },
    );
  });

  it('defaults to white when no colour is given', async () => {
    // The encoder is JPEG either way, so the alpha channel cannot survive. Without a default the
    // resulting colour is the platform's: black on Android, white on iOS.
    const compressImage = loadHandler();

    await compressImage({
      compressImageQuality: 0.5,
      height: 900,
      uri: 'file:///in.png',
      width: 1200,
    });

    expect(createResizedImage.mock.calls[0].at(-1)).toEqual({
      backgroundColor: '#FFFFFF',
      mode: 'cover',
    });
  });

  it('treats an explicit null as opting out, not as "use the default"', async () => {
    const compressImage = loadHandler();

    await compressImage({
      backgroundColor: null,
      compressImageQuality: 0.5,
      height: 900,
      uri: 'file:///in.png',
      width: 1200,
    });

    const options = createResizedImage.mock.calls[0].at(-1);
    expect(options).toEqual({ backgroundColor: null, mode: 'cover' });
    expect(options.backgroundColor).toBeNull();
  });

  it('still clamps the quality and keeps cover mode', async () => {
    const compressImage = loadHandler();

    await compressImage({
      compressImageQuality: 5,
      height: 900,
      uri: 'file:///in.png',
      width: 1200,
    });
    await compressImage({
      compressImageQuality: -3,
      height: 900,
      uri: 'file:///in.png',
      width: 1200,
    });

    expect(createResizedImage.mock.calls[0][4]).toBe(100);
    expect(createResizedImage.mock.calls[1][4]).toBe(0);
    expect(createResizedImage.mock.calls[0].at(-1)).toMatchObject({ mode: 'cover' });
  });

  it('falls back to the original uri when the native call rejects', async () => {
    // Pre-existing behaviour, pinned here because it also swallows the resizer's
    // "unsupported backgroundColor" error - an invalid colour silently skips compression.
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const compressImage = loadHandler();
    createResizedImage.mockRejectedValue(new Error('unsupported backgroundColor'));

    await expect(
      compressImage({
        backgroundColor: 'not-a-colour',
        compressImageQuality: 0.5,
        height: 900,
        uri: 'file:///in.png',
        width: 1200,
      }),
    ).resolves.toBe('file:///in.png');

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
