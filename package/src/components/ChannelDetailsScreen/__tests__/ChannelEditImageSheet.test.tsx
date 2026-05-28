import React from 'react';
import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import type { ChannelDetailsActionItemProps } from '../components/ChannelDetailsActionItem';
import { ChannelEditImageSheet } from '../components/ChannelEditImageSheet';

jest.mock('../../UIComponents/BottomSheetModal', () => {
  const React = require('react');
  return {
    BottomSheetModal: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? <>{children}</> : null,
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

const renderSheet = ({
  onClose = jest.fn(),
  onSelectCamera = jest.fn(),
  onSelectLibrary = jest.fn(),
  onSelectReset,
  visible = true,
}: {
  onClose?: () => void;
  onSelectCamera?: () => void;
  onSelectLibrary?: () => void;
  onSelectReset?: () => void;
  visible?: boolean;
} = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <WithComponents overrides={{ ChannelDetailsActionItem: ActionItemProbe }}>
          <ChannelEditImageSheet
            onClose={onClose}
            onSelectCamera={onSelectCamera}
            onSelectLibrary={onSelectLibrary}
            onSelectReset={onSelectReset}
            visible={visible}
          />
        </WithComponents>
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('ChannelEditImageSheet', () => {
  beforeEach(() => {
    probeCalls.length = 0;
  });

  it('renders the localized header title', () => {
    renderSheet();

    expect(screen.getByText('Edit Group Picture')).toBeTruthy();
  });

  it('renders only Take Photo and Choose Image rows when onSelectReset is omitted', () => {
    renderSheet();

    expect(probeCalls.map((p) => p.label)).toEqual(['Take Photo', 'Choose Image']);
    expect(probeCalls.every((p) => !p.destructive)).toBe(true);
  });

  it('renders the destructive Reset Picture row when onSelectReset is provided', () => {
    renderSheet({ onSelectReset: jest.fn() });

    expect(probeCalls.map((p) => p.label)).toEqual(['Take Photo', 'Choose Image', 'Reset Picture']);
    const byTestID = Object.fromEntries(probeCalls.map((p) => [p.testID, p.destructive]));
    expect(byTestID['channel-edit-picture-take-photo']).toBeFalsy();
    expect(byTestID['channel-edit-picture-choose-image']).toBeFalsy();
    expect(byTestID['channel-edit-picture-reset']).toBe(true);
  });

  it('closes the sheet and invokes onSelectCamera when Take Photo is pressed', () => {
    const onClose = jest.fn();
    const onSelectCamera = jest.fn();
    renderSheet({ onClose, onSelectCamera });

    fireEvent.press(screen.getByTestId('channel-edit-picture-take-photo'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelectCamera).toHaveBeenCalledTimes(1);
  });

  it('closes the sheet and invokes onSelectLibrary when Choose Image is pressed', () => {
    const onClose = jest.fn();
    const onSelectLibrary = jest.fn();
    renderSheet({ onClose, onSelectLibrary });

    fireEvent.press(screen.getByTestId('channel-edit-picture-choose-image'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelectLibrary).toHaveBeenCalledTimes(1);
  });

  it('closes the sheet and invokes onSelectReset when Reset Picture is pressed', () => {
    const onClose = jest.fn();
    const onSelectReset = jest.fn();
    renderSheet({ onClose, onSelectReset });

    fireEvent.press(screen.getByTestId('channel-edit-picture-reset'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelectReset).toHaveBeenCalledTimes(1);
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
