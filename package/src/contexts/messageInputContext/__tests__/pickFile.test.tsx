import React, { PropsWithChildren } from 'react';
import { Alert } from 'react-native';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-hooks';

import { generateFileAttachment } from '../../../mock-builders/generator/attachment';

import * as NativeUtils from '../../../native';

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

afterEach(jest.clearAllMocks);

describe("MessageInputContext's pickFile", () => {
  jest.spyOn(Alert, 'alert');
  jest.spyOn(NativeUtils, 'pickDocument').mockImplementation(
    jest.fn().mockResolvedValue({
      cancelled: false,
      docs: [
        generateFileAttachment({ size: 500000000 }),
        generateFileAttachment({ size: 600000000 }),
      ],
    }),
  );

  const initialProps = {
    editing: true,
    maxNumberOfFiles: 2,
  };

  it.each([
    [3, 1],
    [1, 0],
  ])(
    'run pickFile when numberOfUploads is %d and alert is triggered %d number of times',
    (numberOfUploads, numberOfTimesCalled) => {
      const { rerender, result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: Wrapper,
      });

      act(() => {
        result.current.setNumberOfUploads(numberOfUploads);
      });

      rerender({ editing: false, maxNumberOfFiles: 2 });

      act(() => {
        result.current.pickFile();
      });

      expect(Alert.alert).toHaveBeenCalledTimes(numberOfTimesCalled);
    },
  );

  it('trigger file size threshold limit alert when file size above the limit', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: Wrapper,
    });

    act(() => {
      result.current.pickFile();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});
