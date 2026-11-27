import React from 'react';
import { Alert, AppState, Keyboard, Platform, Pressable, Text } from 'react-native';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type {
  Channel as ChannelType,
  MessageComposer,
  ScheduledMessageResponse,
  StreamChat,
} from 'stream-chat';
import {
  CORE_NOTIFICATION_TYPE,
  dateToNs,
  nsToDate,
  ScheduledMessageBlockReason,
  ScheduledMessagePaginator,
  ScheduledMessagesView,
  StreamAPIError,
} from 'stream-chat';

import { OverlayProvider } from '../../../contexts';
import {
  type MessageComposerAPIContextValue,
  useMessageComposerAPIContext,
} from '../../../contexts/messageComposerContext/MessageComposerAPIContext';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  type MessageInputContextValue,
  useMessageInputContext,
} from '../../../contexts/messageInputContext/MessageInputContext';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { SendButton } from '../../MessageInput/components/OutputButtons/SendButton';
import { MessageComposer as MessageComposerView } from '../../MessageInput/MessageComposer';
import { ChannelScheduledMessages } from '../ChannelScheduledMessages';
import { useEditedScheduledMessage } from '../hooks/useEditedScheduledMessage';
import { ScheduledMessageEditComposer } from '../ScheduledMessageEditComposer';
import { ScheduledMessageList } from '../ScheduledMessageList';
import { ScheduledMessagesBanner } from '../ScheduledMessagesBanner';
import { ScheduleMessageSheet } from '../ScheduleMessageSheet';
import { ScheduleTimePicker } from '../ScheduleTimePicker';

// The real modal runs `dismiss` callbacks only after iOS reports the dismissal, which never
// happens in tests. This one runs `onClose` and then the callback, as the modal does. While
// `mockHeldSheetCloses` is set, a close waits in it, as if the sheet were still sliding away.
let mockHeldSheetCloses: Array<() => void> | undefined;
jest.mock('../../UIComponents/BottomSheetModal', () => {
  const React = require('react');
  const {
    BottomSheetProvider,
  } = require('../../../contexts/bottomSheetContext/BottomSheetContext');
  return {
    BottomSheetModal: ({
      children,
      onClose,
      visible,
    }: {
      children: React.ReactNode;
      onClose: () => void;
      visible: boolean;
    }) => {
      if (!visible) {
        return null;
      }
      const runClose = (callback?: () => void) => {
        const finish = () => {
          onClose();
          callback?.();
        };
        if (mockHeldSheetCloses) mockHeldSheetCloses.push(finish);
        else finish();
      };
      return (
        <BottomSheetProvider
          value={
            {
              close: runClose,
              currentSnapIndex: { value: 0 },
              dismiss: runClose,
              topSnapIndex: { value: 0 },
            } as never
          }
        >
          {children}
        </BottomSheetProvider>
      );
    },
  };
});

let idCounter = 0;

const generateScheduledMessage = (
  channel: ChannelType,
  overrides: Partial<ScheduledMessageResponse> & {
    message?: Partial<ScheduledMessageResponse['message']>;
  } = {},
): ScheduledMessageResponse => {
  idCounter += 1;
  const { message, ...rest } = overrides;
  const now = dateToNs(new Date());
  return {
    cid: channel.cid,
    created_at: now,
    id: `scheduled-${idCounter}`,
    message: { custom: {}, text: `Scheduled text ${idCounter}`, ...message },
    scheduled_at: dateToNs(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    status: 'scheduled',
    updated_at: now,
    user: { id: 'me' } as ScheduledMessageResponse['user'],
    ...rest,
  } as ScheduledMessageResponse;
};

const ingest = (channel: ChannelType, scheduledMessages: ScheduledMessageResponse[]) =>
  act(() => {
    channel.scheduledMessagesPaginator.hydrate(scheduledMessages);
  });

describe('ScheduledMessagesBanner', () => {
  let client: StreamChat;
  let channel: ChannelType;

  const renderBanner = (onScheduledMessagesBannerPress?: jest.Mock) =>
    render(
      <OverlayProvider>
        <Chat client={client}>
          <Channel
            channel={channel}
            onScheduledMessagesBannerPress={onScheduledMessagesBannerPress}
          >
            <ScheduledMessagesBanner />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
    jest.spyOn(channel, 'ensureScheduledMessagesLoaded').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('renders nothing without scheduled messages', async () => {
    renderBanner();
    ingest(channel, []);

    await waitFor(() => expect(screen.queryByTestId('scheduled-messages-banner')).toBeNull());
  });

  it('shows the time of a single scheduled message and opens the list', async () => {
    const onPress = jest.fn();
    renderBanner(onPress);
    ingest(channel, [generateScheduledMessage(channel)]);

    await waitFor(() => expect(screen.getByText(/^Scheduled for /)).toBeTruthy());
    fireEvent.press(screen.getByTestId('scheduled-messages-banner'));

    expect(screen.getByText('View')).toBeTruthy();
    expect(onPress).toHaveBeenCalledWith({ channel, thread: undefined });
  });

  it('counts several scheduled messages, thread replies included', async () => {
    renderBanner(jest.fn());
    ingest(channel, [
      generateScheduledMessage(channel),
      generateScheduledMessage(channel, { message: { parent_id: 'parent-1' } }),
    ]);

    await waitFor(() => expect(screen.getByText('2 scheduled messages')).toBeTruthy());
    expect(screen.getByText('View all')).toBeTruthy();
  });

  it('shows failed messages before the scheduled ones', async () => {
    renderBanner(jest.fn());
    ingest(channel, [
      generateScheduledMessage(channel),
      generateScheduledMessage(channel, { failure_reason: 'internal_error', status: 'failed' }),
    ]);

    await waitFor(() => expect(screen.getByText('1 failed to send')).toBeTruthy());
  });

  it('hides the link when the app has nowhere to open the list', async () => {
    renderBanner();
    ingest(channel, [generateScheduledMessage(channel)]);

    await waitFor(() => expect(screen.getByTestId('scheduled-messages-banner')).toBeTruthy());
    expect(screen.queryByText('View')).toBeNull();
  });
});

describe('ScheduledMessageList', () => {
  let client: StreamChat;
  let channel: ChannelType;

  const renderList = (props: Partial<React.ComponentProps<typeof ChannelScheduledMessages>> = {}) =>
    render(
      <OverlayProvider>
        <Chat client={client}>
          <Channel channel={channel} initializeOnMount={false} markReadOnMount={false}>
            <ChannelScheduledMessages {...props} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
    jest.spyOn(channel.scheduledMessagesPaginator, 'reload').mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  // A list across channels: a view of a paginator of its own, with no Channel around it.
  const renderGlobalList = async (
    scheduledMessages: ScheduledMessageResponse[],
    props: Partial<React.ComponentProps<typeof ScheduledMessageList>> = {},
  ) => {
    const paginator = new ScheduledMessagePaginator({ client });
    jest.spyOn(paginator, 'reload').mockResolvedValue(undefined);
    const view = new ScheduledMessagesView({ paginator });
    render(
      <OverlayProvider>
        <Chat client={client}>
          <ScheduledMessageList view={view} {...props} />
        </Chat>
      </OverlayProvider>,
    );
    act(() => {
      paginator.hydrate(scheduledMessages);
    });
    await waitFor(() =>
      expect(screen.getByTestId(`scheduled-message-item-${scheduledMessages[0].id}`)).toBeTruthy(),
    );
    return paginator;
  };

  it('lists the earliest message first and shows the failure reason', async () => {
    const later = generateScheduledMessage(channel, {
      message: { text: 'later' },
      scheduled_at: dateToNs(new Date(Date.now() + 2 * 60 * 60 * 1000)),
    });
    const earlier = generateScheduledMessage(channel, {
      failure_reason: 'channel_frozen',
      message: { text: 'earlier' },
      scheduled_at: dateToNs(new Date(Date.now() + 60 * 60 * 1000)),
      status: 'failed',
    });
    renderList();
    ingest(channel, [later, earlier]);

    await waitFor(() => expect(screen.getByText('earlier')).toBeTruthy());
    const texts = screen.getAllByText(/^(earlier|later)$/).map((node) => node.props.children);
    expect(texts).toEqual(['earlier', 'later']);
    expect(screen.getByText('This channel is frozen.')).toBeTruthy();
  });

  it("lists only a thread's replies when given the thread's view", async () => {
    const view = new ScheduledMessagesView({
      paginator: channel.scheduledMessagesPaginator,
      scope: { parentId: 'parent-1', type: 'thread' },
    });
    renderList({ view });
    ingest(channel, [
      generateScheduledMessage(channel, { message: { text: 'In the channel' } }),
      generateScheduledMessage(channel, {
        message: { parent_id: 'parent-1', text: 'In the thread' },
      }),
    ]);

    await waitFor(() => expect(screen.getByText(/In the thread/)).toBeTruthy());
    expect(screen.queryByText(/In the channel/)).toBeNull();
  });

  it('filters by the search text', async () => {
    renderList();
    ingest(channel, [
      generateScheduledMessage(channel, { message: { text: 'Launch moved to Monday' } }),
      generateScheduledMessage(channel, { message: { text: 'Kickoff notes' } }),
    ]);

    await waitFor(() => expect(screen.getByText('Kickoff notes')).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText('Search scheduled messages'), 'launch');

    await waitFor(() => expect(screen.queryByText('Kickoff notes')).toBeNull());
    expect(screen.getByText('Launch moved to Monday')).toBeTruthy();
  });

  it('keeps the paginator order for messages due at the same time', async () => {
    const at = dateToNs(new Date(Date.now() + 60 * 60 * 1000));
    const older = generateScheduledMessage(channel, {
      created_at: dateToNs(new Date(Date.now() - 2000)),
      message: { text: 'zulu' },
      scheduled_at: at,
    });
    const newer = generateScheduledMessage(channel, {
      created_at: dateToNs(new Date(Date.now() - 1000)),
      message: { text: 'alpha' },
      scheduled_at: at,
    });
    await renderGlobalList([newer, older]);

    const texts = screen.getAllByText(/^(zulu|alpha)$/).map((node) => node.props.children);
    expect(texts).toEqual(['zulu', 'alpha']);
  });

  it('searches with the filter the app passes', async () => {
    const byChannel = generateScheduledMessage(channel, {
      channel: { name: 'Launch room' } as never,
      message: { text: 'Agenda' },
    });
    const other = generateScheduledMessage(channel, { message: { text: 'Notes' } });
    await renderGlobalList([byChannel, other], {
      searchFilter: (scheduledMessage, query) =>
        !!scheduledMessage.channel?.name?.toLowerCase().includes(query.toLowerCase()),
    });

    fireEvent.changeText(screen.getByLabelText('Search scheduled messages'), 'launch');

    await waitFor(() => expect(screen.queryByText('Notes')).toBeNull());
    expect(screen.getByText('Agenda')).toBeTruthy();
  });

  it('loads the next page while nothing loaded matches the search', async () => {
    const paginator = await renderGlobalList([
      generateScheduledMessage(channel, { message: { text: 'Kickoff notes' } }),
    ]);
    const toTail = jest.spyOn(paginator, 'toTail').mockResolvedValue(undefined);
    act(() => {
      paginator.state.partialNext({ hasMoreTail: true });
    });
    expect(toTail).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Search scheduled messages'), 'launch');

    await waitFor(() => expect(toTail).toHaveBeenCalled());
  });

  it('shows the empty state', async () => {
    renderList();
    ingest(channel, []);

    await waitFor(() => expect(screen.getByText('No scheduled messages')).toBeTruthy());
  });

  it('deletes a scheduled message after the confirmation', async () => {
    const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'To delete' } });
    const { data } = channel.state.getLatestValue();
    channel.state.partialNext({
      data: { ...data, custom: { ...data?.custom, name: 'Maya Ross' } },
    });
    const deleteSpy = jest
      .spyOn(channel.messageOperations, 'deleteScheduledMessage')
      .mockResolvedValue(scheduledMessage);
    const alertSpy = jest.spyOn(Alert, 'alert');
    renderList();
    ingest(channel, [scheduledMessage]);

    await waitFor(() => expect(screen.getByText('To delete')).toBeTruthy());
    fireEvent.press(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`));
    await waitFor(() => expect(screen.getByTestId('scheduled-message-action-delete')).toBeTruthy());
    expect(screen.getByTestId('scheduled-message-action-edit')).toBeTruthy();

    fireEvent.press(screen.getByTestId('scheduled-message-action-delete'));
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(alertSpy.mock.calls[0][1]).toBe(
      "This message to Maya Ross won't be sent. This can't be undone.",
    );
    const buttons = alertSpy.mock.calls[0][2] ?? [];
    await act(() => {
      buttons.find((button) => button.style === 'destructive')?.onPress?.();
      return Promise.resolve();
    });

    expect(deleteSpy).toHaveBeenCalledWith(scheduledMessage.id);
  });

  it('opens the message in a composer of its own, leaving the channel draft alone', async () => {
    const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Edit me' } });
    act(() => {
      channel.messageComposer.textComposer.setText('My draft');
    });
    renderList();
    ingest(channel, [scheduledMessage]);

    await waitFor(() =>
      expect(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`)).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`));
    await waitFor(() => expect(screen.getByTestId('scheduled-message-action-edit')).toBeTruthy());
    fireEvent.press(screen.getByTestId('scheduled-message-action-edit'));

    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    expect(channel.messageComposer.textComposer.text).toBe('My draft');
    expect(channel.messageComposer.editedScheduledMessage).toBeUndefined();
  });

  it('offers no Edit in a list across channels that has nowhere to edit', async () => {
    const scheduledMessage = generateScheduledMessage(channel);
    await renderGlobalList([scheduledMessage]);

    fireEvent.press(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`));
    await waitFor(() =>
      expect(screen.getByTestId('scheduled-message-action-reschedule')).toBeTruthy(),
    );
    expect(screen.queryByTestId('scheduled-message-action-edit')).toBeNull();
  });

  it('refuses send now and reschedule while the quoted message is deleted', async () => {
    const scheduledMessage = generateScheduledMessage(channel, {
      message: { quoted_message_id: 'gone', text: 'Quotes a deleted message' },
    });
    const sendNowSpy = jest.spyOn(channel.messageOperations, 'sendScheduledMessageNow');
    renderList();
    ingest(channel, [scheduledMessage]);
    const openActions = async () => {
      fireEvent.press(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`));
      await waitFor(() =>
        expect(screen.getByTestId('scheduled-message-action-sendNow')).toBeTruthy(),
      );
    };

    await waitFor(() =>
      expect(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`)).toBeTruthy(),
    );
    await openActions();
    fireEvent.press(screen.getByTestId('scheduled-message-action-sendNow'));
    await openActions();
    fireEvent.press(screen.getByTestId('scheduled-message-action-reschedule'));

    await waitFor(() =>
      expect(
        screen.getAllByText('The quoted message was deleted. Edit it to remove the quote.').length,
      ).toBeGreaterThan(1),
    );
    expect(sendNowSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId('schedule-time-sheet')).toBeNull();
  });

  it('lets the app customize the actions', async () => {
    const scheduledMessage = generateScheduledMessage(channel);
    const sendNowSpy = jest.spyOn(channel.messageOperations, 'sendScheduledMessageNow');
    const share = jest.fn();
    renderList({
      getScheduledMessageActionItems: ({ context, defaultItems }) => [
        ...defaultItems.filter(({ id }) => id !== 'reschedule'),
        {
          action: () => share(context.scheduledMessage.id),
          Icon: () => null,
          id: 'share',
          label: 'Share',
          type: 'standard',
        },
      ],
    });
    ingest(channel, [scheduledMessage]);

    await waitFor(() =>
      expect(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`)).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`));
    await waitFor(() => expect(screen.getByTestId('scheduled-message-action-share')).toBeTruthy());
    expect(screen.queryByTestId('scheduled-message-action-reschedule')).toBeNull();
    fireEvent.press(screen.getByTestId('scheduled-message-action-share'));

    await waitFor(() => expect(share).toHaveBeenCalledWith(scheduledMessage.id));
    expect(sendNowSpy).not.toHaveBeenCalled();
  });

  const openReschedule = async (scheduledMessage: ScheduledMessageResponse) => {
    await waitFor(() =>
      expect(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`)).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`));
    await waitFor(() =>
      expect(screen.getByTestId('scheduled-message-action-reschedule')).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId('scheduled-message-action-reschedule'));
    await waitFor(() => expect(screen.getByTestId('schedule-time-sheet')).toBeTruthy());
  };

  it('reschedules a message and keeps the sheet until it has closed', async () => {
    const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Move me' } });
    const updateSpy = jest
      .spyOn(channel.messageOperations, 'updateScheduledMessage')
      .mockResolvedValue(scheduledMessage);
    renderList();
    ingest(channel, [scheduledMessage]);

    await openReschedule(scheduledMessage);
    expect(screen.getByText('Reschedule message')).toBeTruthy();
    expect(screen.getByText(/^Scheduled for /)).toBeTruthy();

    mockHeldSheetCloses = [];
    try {
      await act(() => {
        fireEvent.press(screen.getByTestId('schedule-sheet-confirm'));
        return Promise.resolve();
      });
      await waitFor(() => expect(mockHeldSheetCloses).toHaveLength(1));
      expect(updateSpy).toHaveBeenCalledWith(scheduledMessage.id, {
        request: { scheduled_at: nsToDate(scheduledMessage.scheduled_at) },
      });
      // Still showing the message while it slides away.
      expect(screen.getByTestId('schedule-time-sheet')).toBeTruthy();
      expect(screen.getAllByText('Move me').length).toBeGreaterThan(1);

      act(() => mockHeldSheetCloses?.forEach((finish) => finish()));
    } finally {
      mockHeldSheetCloses = undefined;
    }
    await waitFor(() => expect(screen.queryByTestId('schedule-time-sheet')).toBeNull());
  });

  it('reschedules a failed message from its own time, as a new message', async () => {
    const failed = generateScheduledMessage(channel, {
      message: { text: 'Retry me' },
      status: 'failed',
    });
    const scheduleSpy = jest.spyOn(channel.messageOperations, 'scheduleMessage').mockResolvedValue({
      scheduled_message: generateScheduledMessage(channel),
    } as never);
    const deleteSpy = jest
      .spyOn(channel.messageOperations, 'deleteScheduledMessage')
      .mockResolvedValue(failed);
    renderList();
    ingest(channel, [failed]);

    await openReschedule(failed);
    await act(() => {
      fireEvent.press(screen.getByTestId('schedule-sheet-confirm'));
      return Promise.resolve();
    });

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(failed.id));
    expect(scheduleSpy).toHaveBeenCalledWith(
      expect.objectContaining({ options: { scheduled_at: nsToDate(failed.scheduled_at) } }),
    );
  });

  it('says a reschedule never sends right away when the time is too soon', async () => {
    // The mock channel sets no minimum lead time, so only a time that has passed is too soon.
    const scheduledMessage = generateScheduledMessage(channel, {
      scheduled_at: dateToNs(new Date(Date.now() - 60 * 1000)),
    });
    renderList();
    ingest(channel, [scheduledMessage]);

    await openReschedule(scheduledMessage);

    expect(
      screen.getByText("Pick a later time. Editing can't send a message right away."),
    ).toBeTruthy();
  });

  it('reschedules from a list across channels, outside any Channel', async () => {
    const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Anywhere' } });
    await renderGlobalList([scheduledMessage]);

    await openReschedule(scheduledMessage);

    expect(screen.getByText('Reschedule message')).toBeTruthy();
    expect(screen.getAllByText('Anywhere').length).toBeGreaterThan(1);
  });

  it('hands editing to the app in a list across channels', async () => {
    const scheduledMessage = generateScheduledMessage(channel);
    const onEditScheduledMessage = jest.fn();
    await renderGlobalList([scheduledMessage], { onEditScheduledMessage });

    fireEvent.press(screen.getByTestId(`scheduled-message-item-${scheduledMessage.id}`));
    await waitFor(() => expect(screen.getByTestId('scheduled-message-action-edit')).toBeTruthy());
    fireEvent.press(screen.getByTestId('scheduled-message-action-edit'));

    await waitFor(() => expect(onEditScheduledMessage).toHaveBeenCalledWith(scheduledMessage));
  });
});

describe('ScheduleTimePicker', () => {
  let client: StreamChat;

  beforeEach(async () => {
    ({ client } = await initiateClientWithChannels());
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('disables the hours and minutes earlier than the minimum', () => {
    const at = (hours: number, minutes: number) => {
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    const onSelectTime = jest.fn();
    render(
      <OverlayProvider>
        <Chat client={client}>
          <ScheduleTimePicker
            minimumDate={at(10, 30)}
            onSelectTime={onSelectTime}
            selectedDate={at(10, 45)}
          />
        </Chat>
      </OverlayProvider>,
    );

    fireEvent.press(screen.getByTestId('schedule-time-pill'));

    expect(screen.getByTestId('schedule-time-hours-9').props.accessibilityState.disabled).toBe(
      true,
    );
    expect(screen.getByTestId('schedule-time-hours-10').props.accessibilityState.disabled).toBe(
      false,
    );
    expect(screen.getByTestId('schedule-time-minutes-29').props.accessibilityState.disabled).toBe(
      true,
    );
    fireEvent.press(screen.getByTestId('schedule-time-minutes-29'));
    expect(onSelectTime).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('schedule-time-minutes-30'));
    expect(onSelectTime).toHaveBeenCalledWith(at(10, 30));
  });
});

describe('ScheduleMessageSheet', () => {
  let client: StreamChat;
  let channel: ChannelType;

  const OpenScheduleSheet = () => {
    const { openScheduleSheet } = useMessageInputContext();
    return <Pressable onPress={openScheduleSheet} testID='open-schedule-sheet' />;
  };

  const renderSheets = () => {
    // An empty message isn't composed, so the custom time sheet wouldn't open.
    channel.messageComposer.textComposer.setText('Heads up');
    return render(
      <OverlayProvider>
        <Chat client={client}>
          <Channel channel={channel} initializeOnMount={false} markReadOnMount={false}>
            <ScheduleMessageSheet />
            <OpenScheduleSheet />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );
  };

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
    jest.spyOn(channel, 'ensureScheduledMessagesLoaded').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('opens the quick times on a long press on send', async () => {
    // The mock channel's server config has no scheduled message limits, which turns scheduling off.
    jest.spyOn(channel, 'scheduledMessagesEnabled', 'get').mockReturnValue(true);
    render(
      <OverlayProvider>
        <Chat client={client}>
          <Channel channel={channel} initializeOnMount={false} markReadOnMount={false}>
            <ScheduleMessageSheet />
            <SendButton disabled={false} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    expect(screen.queryByText('Custom time')).toBeNull();
    fireEvent(screen.getByTestId('send-button'), 'longPress');

    await waitFor(() => expect(screen.getByText('Custom time')).toBeTruthy());
  });

  it('opens custom time over the quick times and goes back to them on close', async () => {
    renderSheets();

    fireEvent.press(screen.getByTestId('open-schedule-sheet'));
    fireEvent.press(await screen.findByTestId('schedule-custom-time'));
    await waitFor(() => expect(screen.getByTestId('schedule-time-sheet')).toBeTruthy());
    expect(screen.getByTestId('schedule-message-sheet')).toBeTruthy();
    expect(screen.getByText('Heads up')).toBeTruthy();

    const closeButtons = screen.getAllByTestId('schedule-sheet-close');
    fireEvent.press(closeButtons[closeButtons.length - 1]);

    await waitFor(() => expect(screen.queryByTestId('schedule-time-sheet')).toBeNull());
    expect(screen.getByTestId('schedule-message-sheet')).toBeTruthy();
  });

  it('keeps confirm disabled once the per-user limit is reached', async () => {
    const error = new StreamAPIError('you can schedule at most 100 messages', {
      code: 118,
      status: 400,
    });
    const scheduleSpy = jest
      .spyOn(channel.messageComposer, 'scheduleMessage')
      .mockResolvedValue({ error, status: 'failed' });
    renderSheets();

    fireEvent.press(screen.getByTestId('open-schedule-sheet'));
    fireEvent.press(await screen.findByTestId('schedule-custom-time'));
    await waitFor(() => expect(screen.getByTestId('schedule-sheet-confirm')).toBeTruthy());
    await act(() => {
      fireEvent.press(screen.getByTestId('schedule-sheet-confirm'));
      return Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText(/You've reached your limit of/)).toBeTruthy());
    expect(screen.getByTestId('schedule-sheet-confirm').props.accessibilityState?.disabled).toBe(
      true,
    );
    fireEvent.press(screen.getByTestId('schedule-sheet-confirm'));
    expect(scheduleSpy).toHaveBeenCalledTimes(1);
  });
});

describe('ScheduledMessageEditComposer', () => {
  let client: StreamChat;
  let channel: ChannelType;
  let editScheduledMessage: MessageComposerAPIContextValue['editScheduledMessage'];
  let currentComposer: MessageComposer;

  const ApiProbe = () => {
    ({ editScheduledMessage } = useMessageComposerAPIContext());
    currentComposer = useMessageComposer();
    return null;
  };

  const EditProbe = () => {
    const { editedScheduledMessage } = useEditedScheduledMessage();
    return editedScheduledMessage ? <Text>{`editing ${editedScheduledMessage.id}`}</Text> : null;
  };

  const renderEdit = () =>
    render(
      <OverlayProvider>
        <Chat client={client}>
          <Channel channel={channel} initializeOnMount={false} markReadOnMount={false}>
            <ApiProbe />
            <EditProbe />
            <ScheduledMessageEditComposer />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

  const startEdit = (scheduledMessage: ScheduledMessageResponse) =>
    act(() => editScheduledMessage(scheduledMessage));

  const press = (testID: string) =>
    act(() => {
      fireEvent.press(screen.getByTestId(testID));
      return Promise.resolve();
    });

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
    jest.spyOn(channel, 'ensureScheduledMessagesLoaded').mockImplementation(() => undefined);
    // The mock channel's server config has no scheduled message limits, which turns scheduling off.
    jest.spyOn(channel, 'scheduledMessagesEnabled', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('renders nothing until the edit has loaded', async () => {
    let resolveQuoted: (value: unknown) => void = () => undefined;
    jest
      .spyOn(client, 'getMessage')
      .mockReturnValue(new Promise((resolve) => (resolveQuoted = resolve)) as never);
    const scheduledMessage = generateScheduledMessage(channel, {
      message: { quoted_message_id: 'not-loaded', text: 'Replying' },
    });
    renderEdit();

    act(() => {
      void editScheduledMessage(scheduledMessage);
    });
    await waitFor(() => expect(client.getMessage).toHaveBeenCalled());
    expect(screen.queryByTestId('send-button')).toBeNull();
    expect(screen.queryByText(`editing ${scheduledMessage.id}`)).toBeNull();
    expect(currentComposer).toBe(channel.messageComposer);

    await act(async () => {
      resolveQuoted({ message: { id: 'not-loaded', text: 'Quoted' } });
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText(`editing ${scheduledMessage.id}`)).toBeTruthy());
    expect(screen.getByTestId('send-button')).toBeTruthy();
  });

  it('shows the last message opened when an earlier one finishes loading after it', async () => {
    let resolveQuoted: (value: unknown) => void = () => undefined;
    jest
      .spyOn(client, 'getMessage')
      .mockReturnValue(new Promise((resolve) => (resolveQuoted = resolve)) as never);
    const slow = generateScheduledMessage(channel, {
      message: { quoted_message_id: 'not-loaded', text: 'Slow' },
    });
    const fast = generateScheduledMessage(channel, { message: { text: 'Fast' } });
    renderEdit();

    act(() => {
      void editScheduledMessage(slow);
    });
    await startEdit(fast);
    await waitFor(() => expect(screen.getByText(`editing ${fast.id}`)).toBeTruthy());

    await act(async () => {
      resolveQuoted({ message: { id: 'not-loaded', text: 'Quoted' } });
      await Promise.resolve();
    });

    expect(screen.getByText(`editing ${fast.id}`)).toBeTruthy();
    expect(screen.queryByText(`editing ${slow.id}`)).toBeNull();
  });

  it('saves an edited scheduled message in place and hides the composer', async () => {
    const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Old text' } });
    const updateSpy = jest
      .spyOn(channel.messageOperations, 'updateScheduledMessage')
      .mockImplementation((id) => Promise.resolve({ ...scheduledMessage, id }));
    const scheduleSpy = jest.spyOn(channel.messageOperations, 'scheduleMessage');
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss');
    renderEdit();

    await startEdit(scheduledMessage);
    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    expect(dismissSpy).not.toHaveBeenCalled();
    await press('send-button');

    await waitFor(() => expect(screen.queryByTestId('send-button')).toBeNull());
    expect(updateSpy).toHaveBeenCalledWith(scheduledMessage.id, expect.anything());
    expect(scheduleSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId('schedule-time-sheet')).toBeNull();
    expect(dismissSpy).toHaveBeenCalled();
  });

  describe('focusing the input once the window has focus', () => {
    const originalOS = Platform.OS;
    const setPlatform = (os: typeof Platform.OS) =>
      Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });

    let windowFocusListeners: (() => void)[];
    let inputBoxRef: MessageInputContextValue['inputBoxRef'];

    const InputRefProbe = () => {
      ({ inputBoxRef } = useMessageInputContext());
      return null;
    };

    const renderEditWithInputRef = () =>
      render(
        <OverlayProvider>
          <Chat client={client}>
            <Channel channel={channel} initializeOnMount={false} markReadOnMount={false}>
              <ApiProbe />
              <InputRefProbe />
              <ScheduledMessageEditComposer />
            </Channel>
          </Chat>
        </OverlayProvider>,
      );

    beforeEach(() => {
      windowFocusListeners = [];
      jest.spyOn(AppState, 'addEventListener').mockImplementation((type, listener) => {
        if (type === 'focus') windowFocusListeners.push(listener as () => void);
        return { remove: jest.fn() } as never;
      });
    });

    afterEach(() => setPlatform(originalOS));

    it('focuses the input again on Android, where a closing sheet can still hold the window', async () => {
      setPlatform('android');
      const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Edit me' } });
      renderEditWithInputRef();

      await startEdit(scheduledMessage);
      await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
      const focusSpy = jest.spyOn(
        inputBoxRef.current as NonNullable<typeof inputBoxRef.current>,
        'focus',
      );
      expect(windowFocusListeners).toHaveLength(1);

      focusSpy.mockClear();

      act(() => windowFocusListeners.forEach((listener) => listener()));

      expect(focusSpy).toHaveBeenCalled();
    });

    it('does not wait for the window on iOS', async () => {
      setPlatform('ios');
      const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Edit me' } });
      renderEditWithInputRef();

      await startEdit(scheduledMessage);
      await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());

      expect(windowFocusListeners).toHaveLength(0);
    });
  });

  it('hides the composer when the edit is cancelled', async () => {
    const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Keep me' } });
    const updateSpy = jest.spyOn(channel.messageOperations, 'updateScheduledMessage');
    renderEdit();

    await startEdit(scheduledMessage);
    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    act(() => {
      fireEvent.press(screen.getByTestId('remove-upload-preview'));
    });

    await waitFor(() => expect(screen.queryByTestId('send-button')).toBeNull());
    expect(screen.queryByText(`editing ${scheduledMessage.id}`)).toBeNull();
    expect(updateSpy).not.toHaveBeenCalled();
    await waitFor(() => expect(currentComposer).toBe(channel.messageComposer));
  });

  it('asks for a new time before saving a failed message, then schedules it again', async () => {
    const scheduledAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    scheduledAt.setSeconds(0, 0);
    const failed = generateScheduledMessage(channel, {
      message: { text: 'Retry me' },
      scheduled_at: dateToNs(scheduledAt),
      status: 'failed',
    });
    const updateSpy = jest.spyOn(channel.messageOperations, 'updateScheduledMessage');
    const scheduleSpy = jest.spyOn(channel.messageOperations, 'scheduleMessage').mockResolvedValue({
      scheduled_message: generateScheduledMessage(channel, { message: { text: 'Retry me' } }),
    } as never);
    const deleteSpy = jest
      .spyOn(channel.messageOperations, 'deleteScheduledMessage')
      .mockResolvedValue(failed);
    renderEdit();

    await startEdit(failed);
    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    await press('send-button');

    await waitFor(() => expect(screen.getByTestId('schedule-time-sheet')).toBeTruthy());
    expect(screen.getByText('Reschedule message')).toBeTruthy();
    expect(screen.getByText(/^Scheduled for /)).toBeTruthy();
    expect(scheduleSpy).not.toHaveBeenCalled();

    await press('schedule-sheet-confirm');

    await waitFor(() => expect(screen.queryByTestId('send-button')).toBeNull());
    expect(scheduleSpy).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ scheduled_at: scheduledAt }) }),
    );
    expect(deleteSpy).toHaveBeenCalledWith(failed.id);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('keeps the reschedule sheet open when the edit ends under it', async () => {
    const failed = generateScheduledMessage(channel, {
      message: { text: 'Retry me' },
      status: 'failed',
    });
    renderEdit();

    await startEdit(failed);
    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    await press('send-button');
    await waitFor(() => expect(screen.getByTestId('schedule-time-sheet')).toBeTruthy());

    // Scheduling it again ends the edit the same way, before the sheet starts closing.
    act(() => currentComposer.cancelScheduledMessageEdit());

    await waitFor(() => expect(screen.queryByTestId('send-button')).toBeNull());
    expect(screen.getByTestId('schedule-time-sheet')).toBeTruthy();
    expect(screen.getByText('Retry me')).toBeTruthy();
  });

  it('reschedules a failed message from a channel screen composer too', async () => {
    const failed = generateScheduledMessage(channel, {
      message: { text: 'Retry me' },
      status: 'failed',
    });
    const scheduleSpy = jest.spyOn(channel.messageOperations, 'scheduleMessage').mockResolvedValue({
      scheduled_message: generateScheduledMessage(channel, { message: { text: 'Retry me' } }),
    } as never);
    jest.spyOn(channel.messageOperations, 'deleteScheduledMessage').mockResolvedValue(failed);
    render(
      <OverlayProvider>
        <Chat client={client}>
          <Channel channel={channel} initializeOnMount={false} markReadOnMount={false}>
            <ApiProbe />
            <MessageComposerView />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await startEdit(failed);
    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    await press('send-button');
    await waitFor(() => expect(screen.getByTestId('schedule-time-sheet')).toBeTruthy());
    await press('schedule-sheet-confirm');

    await waitFor(() => expect(scheduleSpy).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('schedule-time-sheet')).toBeNull());
  });

  // An app that mounts a Channel for each edit, as a list across channels does.
  const renderStartedEdit = (scheduledMessage: ScheduledMessageResponse, onClose: jest.Mock) => {
    const tree = (show: boolean) => (
      <OverlayProvider>
        <Chat client={client}>
          <Channel channel={channel} initializeOnMount={false} markReadOnMount={false}>
            <ApiProbe />
            {show ? (
              <ScheduledMessageEditComposer onClose={onClose} scheduledMessage={scheduledMessage} />
            ) : null}
          </Channel>
        </Chat>
      </OverlayProvider>
    );
    const { rerender } = render(tree(true));
    return { unmountEdit: () => rerender(tree(false)) };
  };

  it('starts the edit it is given and reports when a save ends it', async () => {
    const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Old text' } });
    jest
      .spyOn(channel.messageOperations, 'updateScheduledMessage')
      .mockImplementation((id) => Promise.resolve({ ...scheduledMessage, id }));
    const onClose = jest.fn();
    renderStartedEdit(scheduledMessage, onClose);

    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    expect(onClose).not.toHaveBeenCalled();
    await press('send-button');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('reports a cancelled edit, but not an unmount that leaves it open', async () => {
    const first = generateScheduledMessage(channel, { message: { text: 'Cancel me' } });
    const onCancelClose = jest.fn();
    renderStartedEdit(first, onCancelClose);
    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    act(() => {
      fireEvent.press(screen.getByTestId('remove-upload-preview'));
    });
    await waitFor(() => expect(onCancelClose).toHaveBeenCalledTimes(1));
    cleanup();

    const second = generateScheduledMessage(channel, { message: { text: 'Leave me' } });
    const onUnmountClose = jest.fn();
    const { unmountEdit } = renderStartedEdit(second, onUnmountClose);
    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    unmountEdit();

    expect(onUnmountClose).not.toHaveBeenCalled();
  });

  it('waits for the reschedule sheet to close before reporting the end', async () => {
    const failed = generateScheduledMessage(channel, {
      message: { text: 'Retry me' },
      status: 'failed',
    });
    jest.spyOn(channel.messageOperations, 'scheduleMessage').mockResolvedValue({
      scheduled_message: generateScheduledMessage(channel, { message: { text: 'Retry me' } }),
    } as never);
    jest.spyOn(channel.messageOperations, 'deleteScheduledMessage').mockResolvedValue(failed);
    const onClose = jest.fn();
    renderStartedEdit(failed, onClose);

    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    await press('send-button');
    await waitFor(() => expect(screen.getByTestId('schedule-time-sheet')).toBeTruthy());

    mockHeldSheetCloses = [];
    try {
      await press('schedule-sheet-confirm');
      await waitFor(() => expect(mockHeldSheetCloses).toHaveLength(1));
      await waitFor(() => expect(screen.queryByTestId('send-button')).toBeNull());
      expect(onClose).not.toHaveBeenCalled();

      act(() => mockHeldSheetCloses?.forEach((finish) => finish()));
    } finally {
      mockHeldSheetCloses = undefined;
    }
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables save and says why once a command is typed', async () => {
    const scheduledMessage = generateScheduledMessage(channel, { message: { text: 'Launch day' } });
    const blockedToasts = () =>
      client.notifications.notifications.filter(
        ({ type }) => type === CORE_NOTIFICATION_TYPE.scheduledMessageBlocked,
      );
    renderEdit();

    await startEdit(scheduledMessage);
    await waitFor(() => expect(screen.getByText('Edit scheduled message')).toBeTruthy());
    expect(screen.getByTestId('send-button').props.accessibilityState?.disabled).toBe(false);
    expect(blockedToasts()).toHaveLength(0);

    act(() => currentComposer.textComposer.setText('/giphy launch day'));
    await waitFor(() =>
      expect(screen.getByTestId('send-button').props.accessibilityState?.disabled).toBe(true),
    );
    act(() => currentComposer.textComposer.setText('/giphy launch day!'));

    expect(blockedToasts()).toHaveLength(1);
    expect(blockedToasts()[0].metadata).toEqual({ reason: ScheduledMessageBlockReason.Command });

    act(() => currentComposer.textComposer.setText('Launch day'));
    await waitFor(() =>
      expect(screen.getByTestId('send-button').props.accessibilityState?.disabled).toBe(false),
    );
  });

  it('blocks saving while the quoted message is deleted, until the quote is removed', async () => {
    const scheduledMessage = generateScheduledMessage(channel, {
      message: {
        quoted_message: { id: 'quoted', text: '', type: 'deleted' } as never,
        quoted_message_id: 'quoted',
        text: 'Replying',
      },
    });
    renderEdit();

    await startEdit(scheduledMessage);
    await waitFor(() => expect(screen.getByTestId('scheduled-message-quote-deleted')).toBeTruthy());
    expect(screen.getByTestId('send-button').props.accessibilityState?.disabled).toBe(true);

    await press('scheduled-message-remove-quote');

    await waitFor(() => expect(screen.queryByTestId('scheduled-message-quote-deleted')).toBeNull());
    expect(screen.getByTestId('send-button').props.accessibilityState?.disabled).toBe(false);
  });
});
