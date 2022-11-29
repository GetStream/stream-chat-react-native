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

describe("MessageInputContext's uploadFile", () => {
  it('uploadFile works', async () => {
    const doDocUploadRequestMock = jest.fn().mockResolvedValue({
      file: {
        url: '',
      },
      thumb_url: '',
    });
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        doDocUploadRequest: doDocUploadRequestMock,
        editing: true,
      },
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.fileUploads).toHaveLength(0);
    });

    act(() => {
      result.current.uploadFile({ newFile: generateFileUploadPreview({ state: '' }) });
    });

    await waitFor(() => {
      expect(doDocUploadRequestMock).toHaveBeenCalled();
    });
  });

  it('uploadFile catch block gets executed', async () => {
    const doDocUploadRequestMock = jest.fn().mockResolvedValue(new Error('This is an error'));
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        doDocUploadRequest: doDocUploadRequestMock,
        editing: true,
      },
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.fileUploads).toHaveLength(0);
    });

    act(() => {
      result.current.uploadFile({ newFile: generateFileUploadPreview({ state: '' }) });
    });

    await waitFor(() => {
      expect(result.current.fileUploads.length).toBe(0);
    });
  });
});
