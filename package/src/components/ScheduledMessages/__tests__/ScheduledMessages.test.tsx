import React from 'react';
import { Pressable } from 'react-native';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, ScheduledMessageResponse, StreamChat } from 'stream-chat';
import { dateToNs, StreamAPIError } from 'stream-chat';

import { OverlayProvider } from '../../../contexts';
import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { SendButton } from '../../MessageInput/components/OutputButtons/SendButton';
import { ScheduledMessagesBanner } from '../ScheduledMessagesBanner';
import { ScheduleMessageSheet } from '../ScheduleMessageSheet';
import { ScheduleTimePicker } from '../ScheduleTimePicker';

// The real modal runs `dismiss` callbacks only after iOS reports the dismissal, which never
// happens in tests. This one runs `onClose` and then the callback, as the modal does.
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
        onClose();
        callback?.();
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
