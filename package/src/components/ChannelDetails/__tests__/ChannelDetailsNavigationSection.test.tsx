import React from 'react';

import { act, fireEvent, render } from '@testing-library/react-native';

import {
  ChannelDetailsContextProvider,
  type ChannelDetailsContextValue,
} from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import type { ChannelDetailsActionItemProps } from '../components/ChannelDetailsActionItem';
import { ChannelDetailsNavigationSection } from '../components/ChannelDetailsNavigationSection';

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

const pinnedListProbe: object[] = [];

jest.mock('../components/navigation-section/PinnedMessageList', () => {
  const ReactLib = require('react');
  const { Text: RNText } = require('react-native');
  return {
    PinnedMessageList: (props: object) => {
      pinnedListProbe.push(props);
      return ReactLib.createElement(RNText, { testID: 'pinned-message-list' }, 'list');
    },
  };
});

const renderSection = (contextValue: Partial<ChannelDetailsContextValue> = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChannelDetailsContextProvider value={contextValue as ChannelDetailsContextValue}>
          <ChannelDetailsNavigationSection />
        </ChannelDetailsContextProvider>
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

  describe('without a getNavigationItems prop (default mode)', () => {
    it('makes every row interactive', () => {
      renderSection();

      const [pinned, photos, files] = probeCalls;
      expect(pinned.onPress).toBeDefined();
      expect(photos.onPress).toBeDefined();
      expect(files.onPress).toBeDefined();
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

    it('opens an empty modal (no pinned list) for sections without a built-in screen', () => {
      const { getByTestId, queryByTestId } = renderSection();

      fireEvent.press(getByTestId('channel-details-photos-and-videos'));

      expect(modalProbeCalls.at(-1)?.visible).toBe(true);
      expect(queryByTestId('pinned-message-list')).toBeNull();
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

  describe('with a getNavigationItems prop', () => {
    it('receives the built-in default items (section, label, Icon) and a context', () => {
      const getNavigationItems = jest.fn(({ defaultItems }) => defaultItems);
      renderSection({ getNavigationItems });

      expect(getNavigationItems).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({ t: expect.any(Function) }),
          defaultItems: [
            expect.objectContaining({
              Icon: expect.any(Function),
              label: 'Pinned Messages',
              section: 'pinned-messages',
            }),
            expect.objectContaining({ label: 'Photos & Videos', section: 'photos-and-videos' }),
            expect.objectContaining({ label: 'Files', section: 'files' }),
          ],
        }),
      );
      // Default items carry no onPress; the section component supplies the open-modal behavior.
      const { defaultItems } = getNavigationItems.mock.calls[0][0];
      expect(
        defaultItems.every((item: { onPress?: () => void }) => item.onPress === undefined),
      ).toBe(true);
    });

    it('renders exactly the items the customizer returns', () => {
      const getNavigationItems = ({ defaultItems }: { defaultItems: { section: string }[] }) =>
        defaultItems.filter((item) => item.section === 'pinned-messages');
      const { getByTestId, queryByTestId } = renderSection({
        getNavigationItems: getNavigationItems as never,
      });

      expect(getByTestId('channel-details-pinned-messages')).toBeTruthy();
      expect(queryByTestId('channel-details-photos-and-videos')).toBeNull();
      expect(queryByTestId('channel-details-files')).toBeNull();
    });

    it('runs a custom onPress instead of opening the built-in modal', () => {
      const customOnPress = jest.fn();
      const getNavigationItems = ({ defaultItems }: { defaultItems: { onPress: () => void }[] }) =>
        defaultItems.map((item) => ({ ...item, onPress: customOnPress }));
      const { getByTestId } = renderSection({ getNavigationItems: getNavigationItems as never });

      fireEvent.press(getByTestId('channel-details-pinned-messages'));

      expect(customOnPress).toHaveBeenCalledTimes(1);
      expect(modalProbeCalls.at(-1)?.visible).toBe(false);
    });

    it('still opens the built-in modal when a row keeps its default onPress', () => {
      const getNavigationItems = ({ defaultItems }: { defaultItems: unknown[] }) => defaultItems;
      const { getByTestId } = renderSection({ getNavigationItems: getNavigationItems as never });

      fireEvent.press(getByTestId('channel-details-pinned-messages'));

      expect(modalProbeCalls.at(-1)?.visible).toBe(true);
      expect(getByTestId('pinned-message-list')).toBeTruthy();
    });

    it('renders consumer-added rows with custom section identifiers', () => {
      const customOnPress = jest.fn();
      const getNavigationItems = ({ defaultItems }: { defaultItems: unknown[] }) => [
        ...defaultItems,
        {
          Icon: () => null,
          label: 'My Custom Row',
          onPress: customOnPress,
          section: 'my-custom-section',
        },
      ];
      const { getByTestId } = renderSection({ getNavigationItems: getNavigationItems as never });

      const customRow = getByTestId('channel-details-my-custom-section');
      expect(customRow).toBeTruthy();

      fireEvent.press(customRow);
      expect(customOnPress).toHaveBeenCalledTimes(1);
    });
  });
});
