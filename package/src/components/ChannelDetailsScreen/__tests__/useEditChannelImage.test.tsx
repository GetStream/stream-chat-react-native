import React, { PropsWithChildren } from 'react';
import { Alert } from 'react-native';

import { act, renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { generateFileReference } from '../../../mock-builders/attachments';
import { NativeHandlers } from '../../../native';
import { useEditChannelImage } from '../hooks/useEditChannelImage';

jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

const buildChannel = (): Channel =>
  ({
    cid: 'messaging:test',
    data: { name: 'Test' },
    on: () => ({ unsubscribe: () => undefined }),
    state: { members: {} },
  }) as unknown as Channel;

const wrap = ({ compressImageQuality }: { compressImageQuality?: number }) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <TranslationProvider
      value={{
        t: ((key: string) => key) as never,
        tDateTimeParser: ((input: unknown) => input) as never,
        userLanguage: 'en',
      }}
    >
      <ChannelDetailsContextProvider value={{ channel: buildChannel(), compressImageQuality }}>
        {children}
      </ChannelDetailsContextProvider>
    </TranslationProvider>
  );
  return Wrapper;
};

describe('useEditChannelImage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('takePhoto', () => {
    it('forwards compressImageQuality and mediaType=image to NativeHandlers.takePhoto', async () => {
      const file = generateFileReference();
      jest.spyOn(NativeHandlers, 'takePhoto').mockResolvedValue(file);

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({ compressImageQuality: 0.5 }),
      });

      let returned;
      await act(async () => {
        returned = await result.current.takePhoto();
      });

      expect(NativeHandlers.takePhoto).toHaveBeenCalledTimes(1);
      expect(NativeHandlers.takePhoto).toHaveBeenCalledWith({
        compressImageQuality: 0.5,
        mediaType: 'image',
      });
      expect(returned).toBe(file);
    });

    it('shows the permission alert and returns undefined when askToOpenSettings is true', async () => {
      jest
        .spyOn(NativeHandlers, 'takePhoto')
        .mockResolvedValue({ askToOpenSettings: true } as never);

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({}),
      });

      let returned;
      await act(async () => {
        returned = await result.current.takePhoto();
      });

      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Allow camera access in device settings',
        'Device camera is used to take photos or videos.',
        expect.any(Array),
      );
      expect(returned).toBeUndefined();
    });

    it('returns undefined when the user cancels', async () => {
      jest.spyOn(NativeHandlers, 'takePhoto').mockResolvedValue({ cancelled: true } as never);

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({}),
      });

      let returned;
      await act(async () => {
        returned = await result.current.takePhoto();
      });

      expect(Alert.alert).not.toHaveBeenCalled();
      expect(returned).toBeUndefined();
    });
  });

  describe('pickImageFromNativePicker', () => {
    it('requests a single image from NativeHandlers.pickImage', async () => {
      const file = generateFileReference();
      jest
        .spyOn(NativeHandlers, 'pickImage')
        .mockResolvedValue({ assets: [file], cancelled: false });

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({}),
      });

      await act(async () => {
        await result.current.pickImageFromNativePicker();
      });

      expect(NativeHandlers.pickImage).toHaveBeenCalledTimes(1);
      expect(NativeHandlers.pickImage).toHaveBeenCalledWith({ maxNumberOfFiles: 1 });
    });

    it('compresses the picked asset and returns a file with the compressed uri', async () => {
      const file = {
        ...generateFileReference({ uri: 'file:///original' }),
        height: 1000,
        width: 1000,
      };
      jest
        .spyOn(NativeHandlers, 'pickImage')
        .mockResolvedValue({ assets: [file], cancelled: false });
      const compressSpy = jest
        .spyOn(NativeHandlers, 'compressImage')
        .mockResolvedValue('file:///compressed');

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({ compressImageQuality: 0.5 }),
      });

      let returned;
      await act(async () => {
        returned = await result.current.pickImageFromNativePicker();
      });

      expect(compressSpy).toHaveBeenCalledWith({
        compressImageQuality: 0.5,
        height: 1000,
        uri: 'file:///original',
        width: 1000,
      });
      expect(returned).toEqual({ ...file, uri: 'file:///compressed' });
    });

    it('skips compression when compressImageQuality is undefined', async () => {
      const file = {
        ...generateFileReference({ uri: 'file:///original' }),
        height: 1000,
        width: 1000,
      };
      jest
        .spyOn(NativeHandlers, 'pickImage')
        .mockResolvedValue({ assets: [file], cancelled: false });
      const compressSpy = jest.spyOn(NativeHandlers, 'compressImage');

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({}),
      });

      let returned;
      await act(async () => {
        returned = await result.current.pickImageFromNativePicker();
      });

      expect(compressSpy).not.toHaveBeenCalled();
      expect(returned).toEqual({ ...file, uri: 'file:///original' });
    });

    it('shows the permission alert and returns undefined when askToOpenSettings is true', async () => {
      jest
        .spyOn(NativeHandlers, 'pickImage')
        .mockResolvedValue({ askToOpenSettings: true } as never);

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({}),
      });

      let returned;
      await act(async () => {
        returned = await result.current.pickImageFromNativePicker();
      });

      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Allow access to your Gallery',
        'Device gallery permissions is used to take photos or videos.',
        expect.any(Array),
      );
      expect(returned).toBeUndefined();
    });

    it('returns undefined when the user cancels', async () => {
      jest.spyOn(NativeHandlers, 'pickImage').mockResolvedValue({ assets: [], cancelled: true });

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({}),
      });

      let returned;
      await act(async () => {
        returned = await result.current.pickImageFromNativePicker();
      });

      expect(Alert.alert).not.toHaveBeenCalled();
      expect(returned).toBeUndefined();
    });

    it('returns undefined when no assets are returned', async () => {
      jest.spyOn(NativeHandlers, 'pickImage').mockResolvedValue({ assets: [], cancelled: false });

      const { result } = renderHook(() => useEditChannelImage(), {
        wrapper: wrap({}),
      });

      let returned;
      await act(async () => {
        returned = await result.current.pickImageFromNativePicker();
      });

      expect(returned).toBeUndefined();
    });
  });
});
