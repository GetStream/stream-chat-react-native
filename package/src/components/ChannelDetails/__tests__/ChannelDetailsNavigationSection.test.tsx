import React from 'react';

import { act, fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import type { ChannelDetailsActionItemProps } from '../components/ChannelDetailsActionItem';
import {
  ChannelDetailsNavigationSection,
  type ChannelDetailsNavigationSectionProps,
} from '../components/ChannelDetailsNavigationSection';

const probeCalls: ChannelDetailsActionItemProps[] = [];

jest.mock('../components/ChannelDetailsActionItem', () => {
  const ReactLib = require('react');
  const { Text: RNText } = require('react-native');
  return {
    ChannelDetailsActionItem: (props: ChannelDetailsActionItemProps) => {
      probeCalls.push(props);
      return ReactLib.createElement(
        RNText,
        { onPress: props.onPress, testID: props.testID },
        props.label,
      );
    },
  };
});

const modalProbeCalls: { onClose: () => void; visible: boolean }[] = [];

jest.mock('../components/modal/Modal', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    ChannelDetailsModal: (props: {
      children: React.ReactNode;
      onClose: () => void;
      visible: boolean;
    }) => {
      modalProbeCalls.push({ onClose: props.onClose, visible: props.visible });
      return ReactLib.createElement(View, { testID: 'channel-details-modal' }, props.children);
    },
  };
});

const pinnedListProbe: { channel: unknown }[] = [];

jest.mock('../components/navigation-section/PinnedMessageList', () => {
  const ReactLib = require('react');
  const { Text: RNText } = require('react-native');
  return {
    PinnedMessageList: (props: { channel: unknown }) => {
      pinnedListProbe.push(props);
      return ReactLib.createElement(RNText, { testID: 'pinned-message-list' }, 'list');
    },
  };
});

const renderSection = (props: ChannelDetailsNavigationSectionProps = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChannelDetailsNavigationSection {...props} />
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('ChannelDetailsNavigationSection', () => {
  beforeEach(() => {
    probeCalls.length = 0;
    modalProbeCalls.length = 0;
    pinnedListProbe.length = 0;
  });

  it('renders the three navigation rows with their labels and testIDs', () => {
    const { getByTestId } = renderSection();

    expect(getByTestId('channel-details-pinned-messages')).toBeTruthy();
    expect(getByTestId('channel-details-photos-and-videos')).toBeTruthy();
    expect(getByTestId('channel-details-files')).toBeTruthy();

    expect(probeCalls.map((p) => p.testID)).toEqual([
      'channel-details-pinned-messages',
      'channel-details-photos-and-videos',
      'channel-details-files',
    ]);
    expect(probeCalls.map((p) => p.label)).toEqual(['Pinned Messages', 'Photos & Videos', 'Files']);
  });

  it('passes an Icon and a trailing chevron to every row', () => {
    renderSection();

    expect(probeCalls).toHaveLength(3);
    probeCalls.forEach((props) => {
      expect(props.Icon).toBeTruthy();
      expect(props.trailing).toBeTruthy();
    });
  });

  it('reuses a single memoized chevron element across all rows', () => {
    renderSection();

    const [first, second, third] = probeCalls.map((p) => p.trailing);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  describe('without an onPress prop (default mode)', () => {
    it('makes only the pinned messages row interactive', () => {
      renderSection();

      const [pinned, photos, files] = probeCalls;
      expect(pinned.onPress).toBeDefined();
      expect(photos.onPress).toBeUndefined();
      expect(files.onPress).toBeUndefined();
    });

    it('renders a single modal that is hidden with no content until a section is selected', () => {
      const { queryByTestId } = renderSection();

      expect(modalProbeCalls.at(-1)?.visible).toBe(false);
      expect(queryByTestId('pinned-message-list')).toBeNull();
    });

    it('opens the modal with the pinned messages content when the pinned messages row is pressed', () => {
      const { getByTestId } = renderSection();

      fireEvent.press(getByTestId('channel-details-pinned-messages'));

      expect(modalProbeCalls.at(-1)?.visible).toBe(true);
      expect(getByTestId('pinned-message-list')).toBeTruthy();
    });

    it('closes the modal and clears its content when the modal requests it', () => {
      const { getByTestId, queryByTestId } = renderSection();

      fireEvent.press(getByTestId('channel-details-pinned-messages'));
      expect(modalProbeCalls.at(-1)?.visible).toBe(true);

      act(() => {
        modalProbeCalls.at(-1)?.onClose();
      });

      expect(modalProbeCalls.at(-1)?.visible).toBe(false);
      expect(queryByTestId('pinned-message-list')).toBeNull();
    });
  });

  describe('with an onPress prop', () => {
    it('makes every row interactive and emits its section', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderSection({ onPress });

      fireEvent.press(getByTestId('channel-details-pinned-messages'));
      fireEvent.press(getByTestId('channel-details-photos-and-videos'));
      fireEvent.press(getByTestId('channel-details-files'));

      expect(onPress).toHaveBeenNthCalledWith(1, 'pinned-messages');
      expect(onPress).toHaveBeenNthCalledWith(2, 'photos-and-videos');
      expect(onPress).toHaveBeenNthCalledWith(3, 'files');
    });

    it('does not render the built-in modal', () => {
      renderSection({ onPress: jest.fn() });

      expect(modalProbeCalls).toHaveLength(0);
    });
  });
});
