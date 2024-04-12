import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook, waitFor } from '@testing-library/react-native';

import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';

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

const user1 = generateUser();
const message = generateMessage({ user: user1 });
const newMessage = generateMessage({ id: 'new-id' });
describe("MessageInputContext's sendMessageAsync", () => {
  it('sendMessageAsync returns undefined when image state is UPLOAD_FAILED', () => {
    const asyncUploads = {
      'test-file': {
        state: FileState.UPLOAD_FAILED,
        url: 'https://www.test.com',
      },
    };
    const initialProps = {
      editing: message,
    };
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => <Wrapper editing={initialProps.editing} {...props} />,
    });

    act(() => {
      result.current.setAsyncUploads(asyncUploads);
    });

    rerender({ editing: newMessage });

    let data;
    act(() => {
      data = result.current.sendMessageAsync('test-file');
    });

    expect(data).toBeUndefined();
  });

  it.each([[FileState.UPLOADED], [FileState.FINISHED]])(
    'sendImageAsync is been called with %s file upload state and checked for snapshot)',
    async (fileState) => {
      const sendMessageMock = jest.fn();
      const asyncUploads = {
        'test-file': {
          state: fileState,
          url: 'https://www.test.com',
        },
      };
      const initialProps = {
        editing: message,
        quotedMessage: false,
        sendMessage: sendMessageMock,
      };
      const { rerender, result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: (props) => (
          <Wrapper
            editing={initialProps.editing}
            quotedMessage={initialProps.quotedMessage}
            sendMessage={initialProps.sendMessage}
            {...props}
          />
        ),
      });

      await waitFor(() => {
        result.current.setAsyncUploads(asyncUploads);
      });

      rerender({ editing: newMessage, quotedMessage: false, sendMessage: sendMessageMock });

      await waitFor(() => {
        result.current.sendMessageAsync('test-file');
      });

      expect(sendMessageMock.mock.calls[0][0]).toMatchSnapshot();
    },
  );

  it('sendMessageAsync goes to catch block', async () => {
    const sendMessageMock = jest.fn();
    const asyncUploads = {
      'test-file': {
        state: FileState.FINISHED,
        url: 'https://www.test.com',
      },
    };
    const initialProps = {
      editing: message,
      quotedMessage: false,
    };
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          editing={initialProps.editing}
          quotedMessage={initialProps.quotedMessage}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setAsyncUploads(asyncUploads);
    });

    rerender({ editing: newMessage, quotedMessage: false });

    await waitFor(() => {
      result.current.sendMessageAsync('test-file');
    });

    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});
