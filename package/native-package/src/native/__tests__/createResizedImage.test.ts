import { NativeModules } from 'react-native';

import type { Options, ResizeFormat } from '../types';

const NATIVE_RESPONSE = {
  height: 900,
  name: 'out.JPEG',
  path: '/cache/out.JPEG',
  size: 1234,
  uri: 'file:///cache/out.JPEG',
  width: 1200,
};

describe('native createResizedImage', () => {
  const nativeCreateResizedImage = jest.fn();

  /**
   * The module resolves its native binding at import time, so it has to be in place before
   * `../index` is required. Jest leaves `global.__turboModuleProxy` unset, so the module takes
   * the `NativeModules` branch - and that is the one to stub. Setting the TurboModule flag here
   * instead would break every other RN module that resolves through TurboModuleRegistry.
   */
  const loadModule = () => {
    // @ts-expect-error - the real module is only registered by the native side
    NativeModules.StreamChatReactNative = { createResizedImage: nativeCreateResizedImage };

    return require('../index').default as {
      createResizedImage: (
        uri: string,
        width: number,
        height: number,
        format: ResizeFormat,
        quality: number,
        rotation?: number,
        outputPath?: string | null,
        options?: Options,
      ) => Promise<typeof NATIVE_RESPONSE>;
    };
  };

  beforeEach(() => {
    nativeCreateResizedImage.mockResolvedValue(NATIVE_RESPONSE);
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete NativeModules.StreamChatReactNative;
  });

  it('forwards the processed background colour as the trailing argument', async () => {
    const { createResizedImage } = loadModule();

    await expect(
      createResizedImage('file:///in.png', 1200, 900, 'JPEG', 80, 0, null, {
        backgroundColor: '#FFFFFF',
      }),
    ).resolves.toEqual(NATIVE_RESPONSE);

    expect(nativeCreateResizedImage).toHaveBeenCalledWith(
      'file:///in.png',
      1200,
      900,
      'JPEG',
      80,
      'contain',
      false,
      0,
      null,
      0xffffffff,
    );
  });

  it('accepts a named colour and an integer, rotating the integer to 0xAARRGGBB', async () => {
    const { createResizedImage } = loadModule();

    await createResizedImage('file:///in.webp', 1200, 900, 'JPEG', 80, 0, null, {
      backgroundColor: 'white',
    });
    // processColor reads a *number* as 0xRRGGBBAA, so the alpha byte is the last one, not the
    // first. 0x123456ff is therefore opaque, and every byte differs, so a rotation applied in
    // the wrong direction cannot pass this assertion.
    await createResizedImage('file:///in.webp', 1200, 900, 'JPEG', 80, 0, null, {
      backgroundColor: 0x123456ff,
    });

    // Asserted against literals rather than processColor(): what matters is that the native side
    // receives 0xAARRGGBB, and `processColor(x) === processColor(x)` cannot show that. The values
    // are unsigned on both platforms, because the wrapper normalises the sign processColor leaves
    // platform-dependent.
    expect(nativeCreateResizedImage.mock.calls[0].at(-1)).toBe(0xffffffff);
    expect(nativeCreateResizedImage.mock.calls[1].at(-1)).toBe(0xff123456);
  });

  it('forces the colour opaque, so a see-through background is not a silent no-op', async () => {
    const { createResizedImage } = loadModule();

    // Left as given, every one of these would reach a JPEG encoder that has no alpha channel to
    // put them in, and the transparent areas would come out platform-dependent again - which is
    // the whole thing this option exists to prevent. `transparent` is the sharpest case:
    // processColor reduces it to 0, a number, so nothing upstream rejects it.
    for (const backgroundColor of ['transparent', '#FFFFFF00', 0xffffff00, '#12345680']) {
      await createResizedImage('file:///in.png', 1200, 900, 'JPEG', 80, 0, null, {
        backgroundColor,
      });
    }

    expect(nativeCreateResizedImage.mock.calls.map((call) => call.at(-1))).toEqual([
      0xff000000, 0xffffffff, 0xffffffff, 0xff123456,
    ]);
  });

  it('sends null when no background colour is given, leaving the other arguments untouched', async () => {
    const { createResizedImage } = loadModule();

    await createResizedImage('file:///in.png', 640, 480, 'PNG', 100, 90, '/tmp/out', {
      mode: 'cover',
      onlyScaleDown: true,
    });

    expect(nativeCreateResizedImage).toHaveBeenCalledWith(
      'file:///in.png',
      640,
      480,
      'PNG',
      100,
      'cover',
      true,
      90,
      '/tmp/out',
      null,
    );
  });

  it('keeps the default options and argument order when only the required arguments are passed', async () => {
    const { createResizedImage } = loadModule();

    await createResizedImage('file:///in.jpg', 100, 100, 'JPEG', 50);

    expect(nativeCreateResizedImage).toHaveBeenCalledWith(
      'file:///in.jpg',
      100,
      100,
      'JPEG',
      50,
      'contain',
      false,
      0,
      undefined,
      null,
    );
  });

  it('rejects a background colour that cannot be reduced to a plain integer', async () => {
    const { createResizedImage } = loadModule();

    await expect(
      createResizedImage('file:///in.png', 1200, 900, 'JPEG', 80, 0, null, {
        backgroundColor: 'not-a-colour',
      }),
    ).rejects.toThrow(/unsupported backgroundColor/);

    expect(nativeCreateResizedImage).not.toHaveBeenCalled();
  });
});
