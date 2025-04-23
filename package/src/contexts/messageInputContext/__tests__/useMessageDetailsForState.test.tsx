import { renderHook } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import {
  generateFileAttachment,
  generateImageAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';

import { generateUser } from '../../../mock-builders/generator/user';

import { useMessageDetailsForState } from '../hooks/useMessageDetailsForState';

describe('useMessageDetailsForState', () => {
  it.each([
    [{ message: generateMessage({ text: 'Dummy text' }) }],
    [{ initialValue: '', message: generateMessage({ text: 'Dummy text' }) }],
  ])('test state of useMessageDetailsForState when initialProps differ', () => {
    const { result } = renderHook(
      ({ message }) => useMessageDetailsForState(message as unknown as LocalMessage),
      {
        initialProps: { message: generateMessage({ text: 'Dummy text' }) },
      },
    );

    expect(result.current.text).toBe('');
  });

  it('showMoreOptions is true when initialValue and text is same', () => {
    const { result } = renderHook(
      ({ initialValue, message }) =>
        useMessageDetailsForState(message as unknown as LocalMessage, initialValue),
      {
        initialProps: {
          initialValue: 'Dummy text',
          message: generateMessage({ text: 'Dummy text' }),
        },
      },
    );

    expect(result.current.showMoreOptions).toBe(true);
  });

  it('fileUploads, imageUploads and mentionedUsers are not empty when attachments are present in message', () => {
    const { result } = renderHook(
      ({ initialValue, message }) =>
        useMessageDetailsForState(message as unknown as LocalMessage, initialValue),
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
            mentioned_users: [generateUser()],
          }),
        },
      },
    );

    expect(result.current.fileUploads.length).toBeGreaterThan(0);
    expect(result.current.imageUploads.length).toBeGreaterThan(0);
    expect(result.current.mentionedUsers.length).toBeGreaterThan(0);
  });
});
