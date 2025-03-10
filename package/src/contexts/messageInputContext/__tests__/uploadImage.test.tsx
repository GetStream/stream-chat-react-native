import React, { PropsWithChildren } from 'react';

import { renderHook, waitFor } from '@testing-library/react-native';

import { generateImageUploadPreview } from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';

import {
  InputMessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

type WrapperType = Partial<InputMessageInputContextValue>;

const Wrapper = ({ children, ...rest }: PropsWithChildren<WrapperType>) => (
  <MessageInputProvider
    value={
      {
        ...rest,
      } as InputMessageInputContextValue
    }
  >
    {children}
  </MessageInputProvider>
);

const user1 = generateUser();
const message = generateMessage({ user: user1 });
describe("MessageInputContext's uploadImage", () => {
  it('uploadImage works', async () => {
    const doImageUploadRequestMock = jest
      .fn()
      .mockResolvedValue({ file: 'https://www.test.com/dummy.png' });

    const initialProps = {
      doImageUploadRequest: doImageUploadRequestMock,
      editing: message,
    };

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          doImageUploadRequest={initialProps.doImageUploadRequest}
          editing={initialProps.editing}
          {...props}
        />
      ),
    });

    await waitFor(() => {
      result.current.uploadImage({ newImage: generateImageUploadPreview() });
    });

    expect(doImageUploadRequestMock).toHaveBeenCalledTimes(1);
  });
});
