import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-hooks';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { FileState } from '../../../utils/utils';
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

describe("MessageInputContext's sendMessageAsync", () => {
  it('sendMessageAsync returns undefined when image state is UPLOAD_FAILED', () => {
    const asyncUploads = {
      'test-file': {
        state: FileState.UPLOAD_FAILED,
        url: 'https://www.test.com',
      },
    };

    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setAsyncUploads(asyncUploads);
    });

    rerender({ editing: false });

    let data;
    act(() => {
      data = result.current.sendMessageAsync('test-file');
    });

    expect(data).toBeUndefined();
  });

  it.each([[FileState.UPLOADED], [FileState.FINISHED]])(
    'sendImageAsync is been called with %s file upload state and checked for snapshot)',
    (fileState) => {
      const sendMessageMock = jest.fn();
      const asyncUploads = {
        'test-file': {
          state: fileState,
          url: 'https://www.test.com',
        },
      };
      const { rerender, result } = renderHook(() => useMessageInputContext(), {
        initialProps: {
          editing: true,
          quotedMessage: false,
          sendMessage: sendMessageMock,
        },
        wrapper: Wrapper,
      });

      act(() => {
        result.current.setAsyncUploads(asyncUploads);
      });

      rerender({ editing: false, quotedMessage: false, sendMessage: sendMessageMock });

      act(() => {
        result.current.sendMessageAsync('test-file');
      });

      expect(sendMessageMock.mock.calls[0][0]).toMatchSnapshot();
    },
  );

  it('sendMessageAsync goes to catch block', () => {
    const sendMessageMock = jest.fn();
    const asyncUploads = {
      'test-file': {
        state: FileState.FINISHED,
        url: 'https://www.test.com',
      },
    };
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        quotedMessage: false,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setAsyncUploads(asyncUploads);
    });

    rerender({ editing: false, quotedMessage: false });

    act(() => {
      result.current.sendMessageAsync('test-file');
    });

    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});
