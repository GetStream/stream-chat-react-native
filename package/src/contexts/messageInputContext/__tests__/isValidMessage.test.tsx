import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-native';

import {
  generateFileUploadPreview,
  generateImageUploadPreview,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';

import { FileState } from '../../../utils/utils';
import {
  InputMessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

const user1 = generateUser();
const message = generateMessage({ user: user1 });

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

describe("MessageInputContext's isValidMessage", () => {
  const initialProps = {
    editing: message,
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
        wrapper: (props) => (
          <Wrapper
            // @ts-ignore
            editing={initialProps.editing}
            hasImagePicker={initialProps.hasImagePicker}
            {...props}
          />
        ),
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
