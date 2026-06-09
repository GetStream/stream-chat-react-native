import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';
import type { Channel } from 'stream-chat';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useChannelEditDetailsContext } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../hooks/actions/useChannelActions';
import { ChannelEditDetailsModal } from '../components/ChannelEditDetailsModal';

jest.mock('../../../hooks/actions/useChannelActions');
const mockedUseChannelActions = jest.mocked(useChannelActions);

// Stands in for ChannelEditDetails: drives the channel name through the store
// exposed by ChannelEditDetailsContext, the same way the real component does.
const EditDetailsProbe = () => {
  const { store } = useChannelEditDetailsContext();
  return (
    <View>
      <TextInput
        onChangeText={(name) => store.setCurrentName(name)}
        placeholder='channel-name'
        testID='channel-edit-name-input'
      />
      <Pressable onPress={() => store.setCurrentName('Different')} testID='probe-set-name'>
        <Text>set</Text>
      </Pressable>
      <Pressable onPress={() => store.setCurrentName('')} testID='probe-clear-name'>
        <Text>clear</Text>
      </Pressable>
      <Pressable onPress={() => store.setCurrentName('   ')} testID='probe-whitespace-name'>
        <Text>whitespace</Text>
      </Pressable>
    </View>
  );
};

const buildChannel = (overrides?: { name?: string; cid?: string }): Channel =>
  ({
    cid: overrides?.cid ?? 'messaging:test',
    data: { name: overrides?.name ?? 'Original' },
    on: () => ({ unsubscribe: () => undefined }),
    state: { members: {} },
  }) as unknown as Channel;

const renderModal = ({
  channel,
  onClose = jest.fn(),
  visible = true,
}: {
  channel: Channel;
  onClose?: () => void;
  visible?: boolean;
}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <AccessibilityProvider value={{ enabled: true }}>
        <TranslationProvider
          value={{
            t: ((key: string) => key) as never,
            tDateTimeParser: ((input: unknown) => input) as never,
            userLanguage: 'en',
          }}
        >
          <ChatContext.Provider
            value={{ client: { notifications: new NotificationManager(), userID: 'me' } } as never}
          >
            <ChannelDetailsContextProvider value={{ channel }}>
              <WithComponents overrides={{ ChannelEditDetails: EditDetailsProbe }}>
                <ChannelEditDetailsModal onClose={onClose} visible={visible} />
              </WithComponents>
            </ChannelDetailsContextProvider>
          </ChatContext.Provider>
        </TranslationProvider>
      </AccessibilityProvider>
    </ThemeProvider>,
  );

describe('ChannelEditDetailsModal', () => {
  let updateNameSpy: jest.Mock;

  beforeEach(() => {
    updateNameSpy = jest.fn(async (_name: string, options?: { onSuccess?: () => unknown }) => {
      await options?.onSuccess?.();
    });
    mockedUseChannelActions.mockReturnValue({
      updateName: updateNameSpy,
    } as unknown as ReturnType<typeof useChannelActions>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockedUseChannelActions.mockReset();
  });

  it('disables the confirm button on initial render when the name is unchanged', () => {
    renderModal({ channel: buildChannel() });

    expect(
      screen.getByTestId('channel-details-edit-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it('enables the confirm button after typing a different name', () => {
    renderModal({ channel: buildChannel() });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Different');

    expect(
      screen.getByTestId('channel-details-edit-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it('enables the confirm button after clearing a channel that previously had a name', () => {
    renderModal({ channel: buildChannel({ name: 'Original' }) });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), '');

    expect(
      screen.getByTestId('channel-details-edit-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it('enables confirm when the value differs from the initial name only by whitespace', () => {
    renderModal({ channel: buildChannel({ name: 'Original' }) });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), '  Original  ');

    expect(
      screen.getByTestId('channel-details-edit-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it('passes the raw (untrimmed) name to updateName when the user confirms', async () => {
    renderModal({ channel: buildChannel({ name: 'Original' }) });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), '  Renamed  ');

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-edit-confirm-button'));
      await Promise.resolve();
    });

    expect(updateNameSpy).toHaveBeenCalledWith(
      '  Renamed  ',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('passes an empty string to updateName when the user clears and confirms', async () => {
    renderModal({ channel: buildChannel({ name: 'Original' }) });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), '');

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-edit-confirm-button'));
      await Promise.resolve();
    });

    expect(updateNameSpy).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('closes the modal after updateName invokes onSuccess', async () => {
    const onClose = jest.fn();
    renderModal({ channel: buildChannel({ name: 'Original' }), onClose });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-edit-confirm-button'));
      await Promise.resolve();
    });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('keeps the modal open and re-enables confirm when updateName does not invoke onSuccess', async () => {
    updateNameSpy.mockResolvedValueOnce(undefined);
    const onClose = jest.fn();
    renderModal({ channel: buildChannel({ name: 'Original' }), onClose });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-edit-confirm-button'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('channel-details-edit-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false, busy: false });
  });

  it('marks confirm as busy while updateName is in flight', async () => {
    let releaseUpdate: (() => void) | undefined;
    updateNameSpy.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          releaseUpdate = resolve;
        }),
    );
    renderModal({ channel: buildChannel({ name: 'Original' }) });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-edit-confirm-button'));
      await Promise.resolve();
    });

    expect(
      screen.getByTestId('channel-details-edit-confirm-button').props.accessibilityState,
    ).toMatchObject({ busy: true, disabled: true });

    await act(async () => {
      releaseUpdate?.();
      await Promise.resolve();
    });
  });

  it('invokes onClose when the user taps the close button', () => {
    const onClose = jest.fn();
    renderModal({ channel: buildChannel({ name: 'Original' }), onClose });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');
    fireEvent.press(screen.getByLabelText('a11y/Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when the channel has no cid (no notification host id)', () => {
    renderModal({ channel: buildChannel({ cid: '' }) });

    expect(screen.queryByTestId('channel-details-edit-confirm-button')).toBeNull();
  });
});
