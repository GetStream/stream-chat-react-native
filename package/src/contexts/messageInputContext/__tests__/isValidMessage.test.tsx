import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-hooks';

import {
  generateFileUploadPreview,
  generateImageUploadPreview,
} from '../../../mock-builders/generator/attachment';
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

describe("MessageInputContext's isValidMessage", () => {
  const initialProps = {
    editing: true,
    hasImagePicker: true,
  };

  it.each([
    [[], [], [], 0, '', false],
    [[], [], [], 0, 'Dummy Text', true],
    [[generateFileUploadPreview()], [], [], 0, '', true],
    [[], [generateImageUploadPreview()], [], 0, '', true],
    [[], [generateImageUploadPreview({ state: FileState.UPLOAD_FAILED })], [], 0, '', false],
    [[generateFileUploadPreview({ state: FileState.UPLOAD_FAILED })], [], [], 0, '', false],
    [[generateFileUploadPreview({ state: FileState.UPLOADING })], [], [], 0, '', false],
    [[], [generateImageUploadPreview({ state: FileState.UPLOADING })], [], 0, '', false],
  ])(
    'isValidMessage with fileUploads %p, imageUploads %p, mentionedUsers %p, numberOfUploads %d, text %s gives %p',
    (fileUploads, imageUploads, mentionedUsers, numberOfUploads, text, isValidMessageStatus) => {
      const { result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: Wrapper,
      });

      act(() => {
        result.current.setFileUploads(fileUploads);
        result.current.setImageUploads(imageUploads);
        result.current.setMentionedUsers(mentionedUsers);
        result.current.setNumberOfUploads(numberOfUploads);
        result.current.setText(text);
      });

      expect(result.current.isValidMessage()).toBe(isValidMessageStatus);
    },
  );
});
