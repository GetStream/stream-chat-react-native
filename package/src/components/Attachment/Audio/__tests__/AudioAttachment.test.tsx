import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type {
  Channel as ChannelType,
  ChannelOwnCapability,
  LocalMessage,
  StreamChat,
} from 'stream-chat';

import { OverlayProvider } from '../../../../contexts';
import { initiateClientWithChannels } from '../../../../mock-builders/api/initiateClientWithChannels';
import { generateAudioAttachment } from '../../../../mock-builders/attachments';
import { generateUser } from '../../../../mock-builders/generator/user';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { AudioAttachment } from '../AudioAttachment';

jest.mock('../../../../native.ts', () => {
  const View = require('react-native').View;

  return {
    isAudioRecorderAvailable: jest.fn(() => true),
    isDocumentPickerAvailable: jest.fn(() => true),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isImagePickerAvailable: jest.fn(() => true),
    isNativeMultipartUploadAvailable: jest.fn(() => false),
    isSoundPackageAvailable: jest.fn(() => true),
    NativeHandlers: {
      Sound: {
        Player: View,
      },
    },
  };
});

const ME = 'me';
const OTHER = 'other-user';

type AudioItem = React.ComponentProps<typeof AudioAttachment>['item'];

describe('AudioAttachment played mark (CHA-6554)', () => {
  let client: StreamChat;
  let channel: ChannelType;
  let sendMessageMark: jest.Mock;

  const setup = async (capabilities: string[] = ['send-message-mark']) => {
    const result = await initiateClientWithChannels({
      channelsData: [
        {
          channel: { own_capabilities: capabilities as ChannelOwnCapability[] },
        } as never,
      ],
      customUser: generateUser({ id: ME }),
    });
    client = result.client;
    channel = result.channels[0];
    sendMessageMark = jest.fn().mockResolvedValue({
      created: true,
      mark: { created_at: new Date().toISOString(), type: 'played' },
    });
    channel.sendMessageMark = sendMessageMark as unknown as typeof channel.sendMessageMark;
  };

  const makeMessage = (overrides: Record<string, unknown> = {}) =>
    ({
      id: `message-${Math.random().toString(36).slice(2)}`,
      type: 'regular',
      user: { id: OTHER },
      ...overrides,
    }) as unknown as LocalMessage;

  const renderAudio = (message: LocalMessage, props: { isPreview?: boolean } = {}) => {
    const item = generateAudioAttachment({
      custom: { duration: 10, waveform_data: [0.1, 0.5, 0.9] },
      type: 'voiceRecording',
    } as never) as unknown as AudioItem;
    return render(
      <OverlayProvider>
        <Chat client={client}>
          <Channel channel={channel}>
            <AudioAttachment item={item} message={message} {...props} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );
  };

  const press = async () => {
    const button = await screen.findByLabelText('Play Pause Button');
    act(() => {
      fireEvent.press(button);
    });
    await act(async () => {
      await Promise.resolve();
    });
  };

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('sends the played mark once on the first press of another user voice note', async () => {
    await setup();
    const message = makeMessage();
    renderAudio(message);

    await press();
    expect(sendMessageMark).toHaveBeenCalledTimes(1);
    expect(sendMessageMark).toHaveBeenCalledWith({ id: message.id }, { type: 'played' });

    await press();
    expect(sendMessageMark).toHaveBeenCalledTimes(1);
  });

  it('never sends the mark for the own message and shows the played indicator from mark_groups', async () => {
    await setup();
    const message = makeMessage({
      mark_groups: { played: { count: 2, latest_by: [{ id: OTHER }] } },
      user: { id: ME },
    });
    renderAudio(message);

    await press();
    expect(sendMessageMark).not.toHaveBeenCalled();
    expect(await screen.findByTestId('played-indicator')).toBeTruthy();
    expect(screen.getByText('Played')).toBeTruthy();
  });

  it('shows no played indicator on another user message even with mark_groups', async () => {
    await setup();
    renderAudio(makeMessage({ mark_groups: { played: { count: 3, latest_by: [] } } }));

    await screen.findByLabelText('Play Pause Button');
    expect(screen.queryByTestId('played-indicator')).toBeNull();
  });

  it('shows no played indicator on the own message without played marks', async () => {
    await setup();
    renderAudio(makeMessage({ user: { id: ME } }));

    await screen.findByLabelText('Play Pause Button');
    expect(screen.queryByTestId('played-indicator')).toBeNull();
  });

  it('does not send the mark without the send-message-mark capability', async () => {
    await setup(['send-message']);
    renderAudio(makeMessage());

    await press();
    expect(sendMessageMark).not.toHaveBeenCalled();
  });

  it('does not send the mark for a preview', async () => {
    await setup();
    renderAudio(makeMessage(), { isPreview: true });

    await press();
    expect(sendMessageMark).not.toHaveBeenCalled();
  });

  it('does not send the mark for a thread reply', async () => {
    await setup();
    renderAudio(makeMessage({ parent_id: 'parent-message' }));

    await press();
    expect(sendMessageMark).not.toHaveBeenCalled();
  });

  it('does not send the mark when the user already played the message', async () => {
    await setup();
    renderAudio(
      makeMessage({ own_marks: [{ created_at: new Date().toISOString(), type: 'played' }] }),
    );

    await press();
    expect(sendMessageMark).not.toHaveBeenCalled();
  });

  it('logs a rejected mark request through console.warn and does not throw', async () => {
    await setup();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const failure = new Error('mark failed');
    sendMessageMark.mockRejectedValueOnce(failure);
    renderAudio(makeMessage());

    await press();
    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('played mark failed'), failure);
    warn.mockRestore();
  });
});
