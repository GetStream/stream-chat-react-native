import React from 'react';
import { Text } from 'react-native';

import { act, render, screen } from '@testing-library/react-native';

import { nowNs } from 'stream-chat';
import type { StreamChat } from 'stream-chat';

import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../../contexts/componentsContext/ComponentsContext';
import { MessageProvider } from '../../../../contexts/messageContext/MessageContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { MessageHeader } from '../MessageHeader';

describe('MessageHeader', () => {
  let client: StreamChat;
  const message = generateMessage({ id: 'message-1' });
  const reminderData = (remindAt: number | null) =>
    ({
      channel_cid: 'messaging:general',
      created_at: nowNs(),
      message_id: 'message-1',
      remind_at: remindAt,
      updated_at: nowNs(),
      user_id: 'me',
    }) as never;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'me' });
  });

  afterEach(() => {
    client.reminders.clearTimers();
  });

  const renderHeader = (headerMessage = message) =>
    render(
      <ChatProvider value={{ client } as never}>
        <WithComponents
          overrides={{
            MessagePinnedHeader: () => <Text>pinned</Text>,
            MessageReminderHeader: () => <Text>reminder</Text>,
            MessageSavedForLaterHeader: () => <Text>saved for later</Text>,
          }}
        >
          <MessageProvider value={{ alignment: 'left', message: headerMessage } as never}>
            <MessageHeader />
          </MessageProvider>
        </WithComponents>
      </ChatProvider>,
    );

  it('renders no reminder header for a message without a reminder', () => {
    renderHeader({ ...message, pinned: true });
    expect(screen.getByText('pinned')).toBeTruthy();
    expect(screen.queryByText('reminder')).toBeNull();
    expect(screen.queryByText('saved for later')).toBeNull();
  });

  it('switches between saved for later and reminder when the reminder time changes', () => {
    client.reminders.upsertToState({ data: reminderData(null) });
    renderHeader();
    expect(screen.getByText('saved for later')).toBeTruthy();

    act(() => {
      client.reminders.upsertToState({ data: reminderData(nowNs() + 60_000_000_000) });
    });
    expect(screen.getByText('reminder')).toBeTruthy();
    expect(screen.queryByText('saved for later')).toBeNull();

    act(() => {
      client.reminders.upsertToState({ data: reminderData(null) });
    });
    expect(screen.getByText('saved for later')).toBeTruthy();
    expect(screen.queryByText('reminder')).toBeNull();
  });
});
