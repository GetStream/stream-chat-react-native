import React from 'react';

import { render } from '@testing-library/react-native';

import { ChatContextValue, ChatProvider } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';

import { Colors, defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { MessageUserReactionsItem } from '../MessageUserReactionsItem';

jest.mock('../../../icons', () => ({
  Unknown: () => null,
}));

const mockReaction = {
  id: 'user1',
  name: 'John Doe',
  type: 'like',
};

const mockSupportedReactions = [
  { Icon: () => null, type: 'like' },
  { Icon: () => null, type: 'love' },
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

  it('aligns reaction bubble to the right for other users', async () => {
    const { getByLabelText } = await renderComponent();
    const container = getByLabelText('Individual User Reaction on long press message');
    const reactionBubble = container.props.children[0].props.children[1];
    expect(reactionBubble.props.style[1].borderColor).toBe(Colors.grey_gainsboro);
  });

  it('aligns reaction bubble to the left for the current user', async () => {
    const { getByLabelText } = await renderComponent({}, 'user1');
    const container = getByLabelText('Individual User Reaction on long press message');
    const reactionBubble = container.props.children[0].props.children[1];
    expect(reactionBubble.props.style[1].borderColor).toBe(Colors.white);
  });

  it('uses Unknown icon for unsupported reaction types', async () => {
    const { getByLabelText } = await renderComponent({
      reaction: { ...mockReaction, type: 'unsupported' },
    });
    const container = getByLabelText('Individual User Reaction on long press message');
    const reactionIcon = container.props.children[0].props.children[1].props.children;
    expect(reactionIcon.type.name).toBe('Unknown');
  });

  it('uses correct icon for supported reaction types', async () => {
    const { getByLabelText } = await renderComponent();
    const container = getByLabelText('Individual User Reaction on long press message');
    const reactionIcon = container.props.children[0].props.children[1].props.children;
    expect(reactionIcon.type).not.toBe('Unknown');
  });
});
