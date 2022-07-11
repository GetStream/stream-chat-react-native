import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-hooks';

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

describe("MessageInputContext's uploadImage", () => {
  it('uploadImage works', async () => {
    const doImageUploadRequestMock = jest
      .fn()
      .mockResolvedValue({ file: 'https://www.test.com/dummy.png' });

    const initialProps = {
      doImageUploadRequest: doImageUploadRequestMock,
      editing: true,
    };

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.uploadImage({ newImage: generateImageUploadPreview() });
    });

    expect(doImageUploadRequestMock).toHaveBeenCalledTimes(1);
  });
});
