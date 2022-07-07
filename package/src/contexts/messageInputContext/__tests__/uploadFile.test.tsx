import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-hooks';

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
  it('uploadFile works', () => {
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

    expect(result.current.fileUploads).toHaveLength(0);

    act(() => {
      result.current.uploadFile({ newFile: generateFileUploadPreview({ state: '' }) });
    });

    expect(doDocUploadRequestMock).toHaveBeenCalled();
  });

  it('uploadFile catch block gets executed', () => {
    const doDocUploadRequestMock = jest.fn().mockResolvedValue(new Error('This is an error'));
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        doDocUploadRequest: doDocUploadRequestMock,
        editing: true,
      },
      wrapper: Wrapper,
    });

    expect(result.current.fileUploads).toHaveLength(0);

    act(() => {
      result.current.uploadFile({ newFile: generateFileUploadPreview({ state: '' }) });
    });

    expect(result.current.fileUploads.length).toBe(0);
  });
});
