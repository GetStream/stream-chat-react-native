describe('expo compressImage', () => {
  const manipulateAsync = jest.fn();

  const loadHandler = () => {
    jest.doMock('expo-image-manipulator', () => ({ manipulateAsync }), { virtual: true });

    return require('../compressImage').compressImage as (params: {
      compressImageQuality: number;
      uri: string;
    }) => Promise<string>;
  };

  beforeEach(() => {
    manipulateAsync.mockResolvedValue({ uri: 'file:///cache/out.jpg' });
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('ignores a background colour rather than forwarding one', async () => {
    // Deliberate asymmetry: backgroundColor is CLI-only. expo-image-manipulator can only fill a
    // background while *extending* an image and marks that option @platform web, so there is no
    // way to honour it here.
    //
    // The *type-level* guarantee (passing one is a compile error) is enforced by tsc over `src`,
    // not by this file - expo-package/tsconfig.json excludes `**/__tests__`, so a
    // `@ts-expect-error` here would never be verified and would only look like a guarantee.
    // What this test pins is the runtime half: nothing reaches ImageManipulator.
    const compressImage = loadHandler();

    await compressImage({
      compressImageQuality: 0.5,
      uri: 'file:///in.png',
      ...({ backgroundColor: '#FFFFFF' } as Record<string, never>),
    });

    expect(manipulateAsync).toHaveBeenCalledWith('file:///in.png', [], { compress: 0.5 });
    const [, , options] = manipulateAsync.mock.calls[0];
    expect(options).not.toHaveProperty('backgroundColor');
    expect(Object.keys(options)).toEqual(['compress']);
  });
});
