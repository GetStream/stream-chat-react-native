import React, { PropsWithChildren } from 'react';
import { Alert } from 'react-native';
import { act } from 'react-test-renderer';

import { renderHook, waitFor } from '@testing-library/react-native';

import { generateFileAttachment } from '../../../mock-builders/generator/attachment';

import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import * as NativeUtils from '../../../native';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import * as AttachmentPickerContext from '../../attachmentPickerContext/AttachmentPickerContext';

import {
  InputMessageInputContextValue,
  MessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

const user1 = generateUser();
const message = generateMessage({ user: user1 });
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

afterEach(jest.clearAllMocks);

describe("MessageInputContext's pickFile", () => {
  jest.spyOn(Alert, 'alert');
  jest.spyOn(NativeUtils, 'pickDocument').mockImplementation(
    jest.fn().mockResolvedValue({
      assets: [
        generateFileAttachment({ size: 500000000 }),
        generateFileAttachment({ size: 600000000 }),
      ],
      cancelled: false,
    }),
  );
  jest.spyOn(AttachmentPickerContext, 'useAttachmentPickerContext').mockImplementation(() => ({
    selectedFiles: [],
    setSelectedFiles: jest.fn(),
  }));

  const initialProps = {
    editing: message,
    maxNumberOfFiles: 2,
  };

  it.each([[3, 2]])(
    'run pickFile when numberOfUploads is %d and alert is triggered %d number of times',
    async (numberOfUploads, numberOfTimesCalled) => {
      const { rerender, result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: (props) => (
          <Wrapper
            // @ts-ignore
            editing={initialProps.editing}
            maxNumberOfFiles={initialProps.maxNumberOfFiles}
            {...props}
          />
        ),
      });

      act(() => {
        result.current.setNumberOfUploads(numberOfUploads);
      });

      rerender({ editing: message, maxNumberOfFiles: 2 });

      await waitFor(() => {
        result.current.pickFile();
      });

      expect(Alert.alert).toHaveBeenCalledTimes(numberOfTimesCalled);
    },
  );

  it('trigger file size threshold limit alert when file size above the limit', async () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        // @ts-ignore
        <Wrapper
          editing={initialProps.editing}
          maxNumberOfFiles={initialProps.maxNumberOfFiles}
          {...props}
        />
      ),
    });

    await waitFor(() => {
      result.current.pickFile();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(2);
  });
});
