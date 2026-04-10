import React from 'react';

import { render } from '@testing-library/react-native';

import { generateGiphyAttachment } from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelLastMessagePreview } from '../ChannelLastMessagePreview';

describe('ChannelLastMessagePreview', () => {
  it('shows Giphy instead of slash-command text for giphy attachments with quoted replies', async () => {
    const client = await getTestClientWithUser({ id: 'preview-user' });
    const user = generateUser();
    const message = generateMessage({
      attachments: [generateGiphyAttachment()],
      quoted_message: generateMessage({ text: 'quoted message', user }),
      text: '/giphy Cat',
      user,
    });

    const { getByText, queryByText } = render(
      <Chat client={client}>
        <ChannelLastMessagePreview message={message} />
      </Chat>,
    );

    expect(getByText('Giphy')).toBeTruthy();
    expect(queryByText('/giphy Cat')).toBeNull();
  });
});
