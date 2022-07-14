import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-hooks';

import { waitFor } from '@testing-library/react-native';

import { generateFileUploadPreview } from '../../../mock-builders/generator/attachment';
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

describe("MessageInputContext's removeFile", () => {
  const initialProps = {
    editing: true,
  };

  const file = generateFileUploadPreview({
    file: {
      id: 'test',
      name: 'Test Image',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    },
  });

  it.each([
    [file.id, 0, 0],
    ['dummy', 1, 1],
  ])(
    'removeFile is been called with %s and checked for expectedFileUploadsLength %i, and expectedNumberOfUploadsLength %i)',
    async (fileId, expectedFileUploadsLength, expectedNumberOfUploadsLength) => {
      const { rerender, result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: Wrapper,
      });

      act(() => {
        result.current.setFileUploads([file]);
        result.current.setNumberOfUploads(1);
      });

      rerender({ editing: false });

      await waitFor(() => {
        expect(result.current.fileUploads.length).toBe(1);
      });

      act(() => {
        result.current.removeFile(fileId);
      });

      rerender({ editing: true });

      await waitFor(() => {
        expect(result.current.fileUploads.length).toBe(expectedFileUploadsLength);
        expect(result.current.numberOfUploads).toBe(expectedNumberOfUploadsLength);
      });
    },
  );
});
