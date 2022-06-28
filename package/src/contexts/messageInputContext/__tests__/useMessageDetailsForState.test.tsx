import { renderHook } from '@testing-library/react-hooks';
import type { MessageType } from 'src/components';
import type { DefaultStreamChatGenerics } from 'src/types/types';

import {
  generateFileAttachment,
  generateImageAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';

import { generateUser } from '../../../mock-builders/generator/user';
import { useMessageDetailsForState } from '../hooks/useMessageDetailsForState';

describe('useMessageDetailsForState', () => {
  it('text should be an empty string when initialValue is not present', () => {
    const { result } = renderHook(({ message }) => useMessageDetailsForState(message), {
      initialProps: { message: true },
    });

    expect(result.current.text).toBe('');
  });

  it('text should be an empty string when initialValue is empty', () => {
    const { result } = renderHook(
      ({ initialValue, message }) => useMessageDetailsForState(message, initialValue),
      { initialProps: { initialValue: '', message: true } },
    );

    expect(result.current.text).toBe('');
  });

  it('showMoreOptions is true when initialValue and text is same', () => {
    const { result } = renderHook(
      ({ initialValue, message }) => useMessageDetailsForState(message, initialValue),
      { initialProps: { initialValue: 'Dummy text', message: true } },
    );

    expect(result.current.showMoreOptions).toBe(true);
  });

  it('mentioned users is not empty when its present in messages', () => {
    const { result } = renderHook(
      ({ initialValue, message }) =>
        useMessageDetailsForState(
          message as unknown as MessageType<DefaultStreamChatGenerics> | boolean,
          initialValue,
        ),
      {
        initialProps: {
          initialValue: '',
          message: generateMessage({ mentioned_users: [generateUser()] }),
        },
      },
    );

    expect(result.current.mentionedUsers.length).toBe(1);
  });

  it('has fileUploads and imageUploads when attachments are present in message', () => {
    const { result } = renderHook(
      ({ initialValue, message }) =>
        useMessageDetailsForState(
          message as unknown as MessageType<DefaultStreamChatGenerics> | boolean,
          initialValue,
        ),
      {
        initialProps: {
          initialValue: '',
          message: generateMessage({
            attachments: [
              generateFileAttachment(),
              generateImageAttachment(),
              generateFileAttachment({ type: 'video' }),
              generateFileAttachment({ type: 'audio' }),
            ],
          }),
        },
      },
    );

    expect(result.current.fileUploads.length).toBeGreaterThan(0);
    expect(result.current.imageUploads.length).toBeGreaterThan(0);
  });
});
