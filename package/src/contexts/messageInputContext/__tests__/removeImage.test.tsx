import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-hooks';

import { waitFor } from '@testing-library/react-native';

import { generateImageUploadPreview } from '../../../mock-builders/generator/attachment';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import {
  InputMessageInputContextValue,
  MessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

type WrapperType<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  Partial<InputMessageInputContextValue<StreamChatGenerics>>;

const Wrapper = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>({
  children,
  ...rest
}: PropsWithChildren<WrapperType<StreamChatGenerics>>) => (
  <MessageInputProvider
    value={
      {
        ...rest,
      } as MessageInputContextValue<StreamChatGenerics>
    }
  >
    {children}
  </MessageInputProvider>
);

describe("MessageInputContext's removeImage", () => {
  const initialProps = {
    editing: true,
  };
  const image = generateImageUploadPreview({
    file: {
      id: 'test',
      name: 'Test Image',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    },
  });
  it.each([
    [image.id, 0, 0],
    ['dummy', 1, 1],
  ])(
    'removeImage is been called with %s and checked for expectedImageUploadsLength %i, and expectedNumberOfUploadsLength %i)',
    async (imageId, expectedImageUploadsLength, expectedNumberOfUploadsLength) => {
      const { rerender, result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: Wrapper,
      });

      act(() => {
        result.current.setImageUploads([image]);
        result.current.setNumberOfUploads(1);
      });

      rerender({ editing: false });

      await waitFor(() => {
        expect(result.current.imageUploads.length).toBe(1);
      });

      act(() => {
        result.current.removeImage(imageId);
      });

      rerender({ editing: true });

      await waitFor(() => {
        expect(result.current.imageUploads.length).toBe(expectedImageUploadsLength);
        expect(result.current.numberOfUploads).toBe(expectedNumberOfUploadsLength);
      });
    },
  );
});
