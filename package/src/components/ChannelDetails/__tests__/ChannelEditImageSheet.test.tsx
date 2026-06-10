import React from 'react';
import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChannelEditDetailsContext } from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { EditChannelDetailsStore } from '../../../state-store/edit-channel-details-store';
import type { ChannelDetailsActionItemProps } from '../components/ChannelDetailsActionItem';
import { ChannelEditImageSheet } from '../components/ChannelEditImageSheet';

jest.mock('../../UIComponents/BottomSheetModal', () => {
  const React = require('react');
  const {
    BottomSheetProvider,
  } = require('../../../contexts/bottomSheetContext/BottomSheetContext');
  // Emulate the real modal: both `close` and `dismiss` run `onClose` and then the
  // optional finished-callback, and the modal supplies the BottomSheetContext that
  // `ChannelEditImageSheet` reads `close`/`dismiss` from.
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

type Probe = ChannelDetailsActionItemProps & { testID?: string };

const probeCalls: Probe[] = [];
const ActionItemProbe = (props: Probe) => {
  probeCalls.push(props);
  return (
    <Text onPress={props.onPress} testID={props.testID}>
      {props.label}
    </Text>
  );
};

const buildChannel = (overrides?: { image?: string }): Channel =>
  ({
    cid: 'messaging:test',
    data: {
      ...(overrides && 'image' in overrides ? { image: overrides.image } : {}),
    },
    on: () => ({ unsubscribe: () => undefined }),
    state: { members: {} },
  }) as unknown as Channel;

const renderSheet = ({
  channel = buildChannel(),
  onClose = jest.fn(),
  visible = true,
}: {
  channel?: Channel;
  onClose?: () => void;
  visible?: boolean;
} = {}) => {
  const store = new EditChannelDetailsStore(channel);
  const utils = render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChannelEditDetailsContext.Provider value={{ store }}>
          <WithComponents overrides={{ ChannelDetailsActionItem: ActionItemProbe }}>
            <ChannelEditImageSheet onClose={onClose} visible={visible} />
          </WithComponents>
        </ChannelEditDetailsContext.Provider>
      </TranslationProvider>
    </ThemeProvider>,
  );
  return { ...utils, store };
};

describe('ChannelEditImageSheet', () => {
  beforeEach(() => {
    probeCalls.length = 0;
  });

  it('renders the localized header title', () => {
    renderSheet();

    expect(screen.getByText('Edit Group Picture')).toBeTruthy();
  });

  it('renders only Take Photo and Choose Image rows when there is no image to reset', () => {
    renderSheet({ channel: buildChannel() });

    expect(probeCalls.map((p) => p.label)).toEqual(['Take Photo', 'Choose Image']);
    expect(probeCalls.every((p) => !p.destructive)).toBe(true);
  });

  it('renders the destructive Reset Picture row when the channel has an image', () => {
    renderSheet({ channel: buildChannel({ image: 'https://example.com/live.png' }) });

    expect(probeCalls.map((p) => p.label)).toEqual(['Take Photo', 'Choose Image', 'Reset Picture']);
    const byTestID = Object.fromEntries(probeCalls.map((p) => [p.testID, p.destructive]));
    expect(byTestID['channel-edit-picture-take-photo']).toBeFalsy();
    expect(byTestID['channel-edit-picture-choose-image']).toBeFalsy();
    expect(byTestID['channel-edit-picture-reset']).toBe(true);
  });

  it('closes the sheet and sets the camera pending action when Take Photo is pressed', () => {
    const onClose = jest.fn();
    const { store } = renderSheet({ onClose });

    fireEvent.press(screen.getByTestId('channel-edit-picture-take-photo'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(store.state.getLatestValue().pendingAction).toBe('camera');
  });

  it('closes the sheet and sets the library pending action when Choose Image is pressed', () => {
    const onClose = jest.fn();
    const { store } = renderSheet({ onClose });

    fireEvent.press(screen.getByTestId('channel-edit-picture-choose-image'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(store.state.getLatestValue().pendingAction).toBe('library');
  });

  it('closes the sheet and sets the reset pending action when Reset Picture is pressed', () => {
    const onClose = jest.fn();
    const { store } = renderSheet({
      channel: buildChannel({ image: 'https://example.com/live.png' }),
      onClose,
    });

    fireEvent.press(screen.getByTestId('channel-edit-picture-reset'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(store.state.getLatestValue().pendingAction).toBe('reset');
  });

  it('invokes onClose when the header close button is pressed', () => {
    const onClose = jest.fn();
    renderSheet({ onClose });

    fireEvent.press(screen.getByTestId('channel-edit-picture-sheet-close-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when visible is false', () => {
    const { toJSON } = renderSheet({ visible: false });

    expect(toJSON()).toBeNull();
  });
});
