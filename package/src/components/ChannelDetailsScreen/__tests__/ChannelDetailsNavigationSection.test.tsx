import React from 'react';

import { render } from '@testing-library/react-native';

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

const renderSection = () =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChannelDetailsNavigationSection />
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('ChannelDetailsNavigationSection', () => {
  beforeEach(() => {
    probeCalls.length = 0;
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

  it('passes an Icon and a trailing chevron to every row and leaves them non-interactive', () => {
    renderSection();

    expect(probeCalls).toHaveLength(3);
    probeCalls.forEach((props) => {
      expect(props.Icon).toBeTruthy();
      expect(props.trailing).toBeTruthy();
      expect(props.onPress).toBeUndefined();
    });
  });

  it('reuses a single memoized chevron element across all rows', () => {
    renderSection();

    const [first, second, third] = probeCalls.map((p) => p.trailing);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });
});
