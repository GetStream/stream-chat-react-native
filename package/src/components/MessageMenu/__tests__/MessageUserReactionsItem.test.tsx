import React from 'react';

import { Text } from 'react-native';

import { render } from '@testing-library/react-native';

import { ChatContextValue, ChatProvider } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';

import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { MessageUserReactionsItem } from '../MessageUserReactionsItem';

jest.mock('../../../icons', () => ({
  Unknown: () => {
    const { Text } = require('react-native');
    return <Text testID='unknown-icon'>unknown</Text>;
  },
}));

const mockReaction = {
  id: 'user1',
  name: 'John Doe',
  type: 'like',
};

const mockSupportedReactions = [
  { Icon: () => <Text testID='like-icon'>like</Text>, type: 'like' },
  { Icon: () => <Text testID='love-icon'>love</Text>, type: 'love' },
];

const MockOverlayReactionsAvatar = () => null;

const renderComponent = async (props = {}, clientUserID = 'user2') =>
  render(
    <ChatProvider
      value={{ client: await getTestClientWithUser({ id: clientUserID }) } as ChatContextValue}
    >
      <ThemeProvider theme={defaultTheme}>
        <MessageUserReactionsItem
          MessageUserReactionsAvatar={MockOverlayReactionsAvatar}
          reaction={mockReaction}
          supportedReactions={mockSupportedReactions}
          {...props}
        />
      </ThemeProvider>
    </ChatProvider>,
  );

describe('MessageUserReactionsItem', () => {
  it('renders correctly', async () => {
    const { getByLabelText, getByText } = await renderComponent();
    expect(getByLabelText('Individual User Reaction on long press message')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
  });

  it("doesn't show remove hint for other users", async () => {
    const { queryByText } = await renderComponent();
    expect(queryByText('Tap to remove')).toBeNull();
  });

  it('shows remove hint for current user', async () => {
    const { getByText } = await renderComponent({}, 'user1');
    expect(getByText('Tap to remove')).toBeTruthy();
  });

  it('uses Unknown icon for unsupported reaction types', async () => {
    const { getByTestId, queryByTestId } = await renderComponent({
      reaction: { ...mockReaction, type: 'unsupported' },
    });
    expect(getByTestId('unknown-icon')).toBeTruthy();
    expect(queryByTestId('like-icon')).toBeNull();
  });

  it('uses correct icon for supported reaction types', async () => {
    const { getByTestId, queryByTestId } = await renderComponent();
    expect(getByTestId('like-icon')).toBeTruthy();
    expect(queryByTestId('unknown-icon')).toBeNull();
  });
});
