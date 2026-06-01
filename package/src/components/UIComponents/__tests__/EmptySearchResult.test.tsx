import React from 'react';
import { Text, View } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { EmptySearchResult } from '../EmptySearchResult';

type EmptySearchResultProps = React.ComponentProps<typeof EmptySearchResult>;

const renderComponent = (props: Partial<EmptySearchResultProps> = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <EmptySearchResult
        icon={<View testID='empty-search-result-icon' />}
        label='No results'
        {...props}
      />
    </ThemeProvider>,
  );

describe('EmptySearchResult', () => {
  it('renders the empty-search-result testID', () => {
    renderComponent();

    expect(screen.getByTestId('empty-search-result')).toBeTruthy();
  });

  it('renders the icon node passed via the icon prop', () => {
    renderComponent({ icon: <View testID='custom-icon' /> });

    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });

  it('renders the label text', () => {
    renderComponent({ label: 'Nothing here' });

    expect(screen.getByText('Nothing here')).toBeTruthy();
  });

  it('honors a custom container style override from the theme', () => {
    const customTheme = {
      ...defaultTheme,
      emptySearchResult: {
        container: { backgroundColor: 'rgb(255, 0, 0)' },
        text: {},
      },
    };

    render(
      <ThemeProvider theme={customTheme}>
        <EmptySearchResult icon={<View />} label='Empty' />
      </ThemeProvider>,
    );

    const container = screen.getByTestId('empty-search-result');
    const flattened = Array.isArray(container.props.style)
      ? Object.assign({}, ...container.props.style.flat(Infinity).filter(Boolean))
      : container.props.style;
    expect(flattened.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('honors a custom text style override from the theme', () => {
    const customTheme = {
      ...defaultTheme,
      emptySearchResult: {
        container: {},
        text: { color: 'rgb(0, 255, 0)' },
      },
    };

    render(
      <ThemeProvider theme={customTheme}>
        <EmptySearchResult icon={<View />} label='Empty' />
      </ThemeProvider>,
    );

    const label = screen.getByText('Empty') as unknown as { props: { style: unknown } };
    const flattened = Array.isArray(label.props.style)
      ? Object.assign({}, ...(label.props.style as unknown[]).flat(Infinity).filter(Boolean))
      : label.props.style;
    expect((flattened as { color?: string }).color).toBe('rgb(0, 255, 0)');
  });

  it('renders any node passed as icon, including text', () => {
    renderComponent({ icon: <Text testID='icon-as-text'>icon</Text> });

    expect(screen.getByTestId('icon-as-text')).toBeTruthy();
  });
});
