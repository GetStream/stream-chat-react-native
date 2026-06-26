import React from 'react';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { Pin } from '../../../icons/pin';
import { EmptyList } from '../EmptyList';

type EmptyListProps = React.ComponentProps<typeof EmptyList>;

const renderComponent = (props: Partial<EmptyListProps> = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <EmptyList icon={Pin} title='No pinned messages' {...props} />
    </ThemeProvider>,
  );

describe('EmptyList', () => {
  it('renders the empty-list testID', () => {
    renderComponent();
    expect(screen.getByTestId('empty-list')).toBeTruthy();
  });

  it('renders the title text', () => {
    renderComponent({ title: 'Nothing here' });
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });

  it('renders the subtitle when provided', () => {
    renderComponent({ subtitle: 'Long-press a message to pin it to the chat' });
    expect(screen.getByText('Long-press a message to pin it to the chat')).toBeTruthy();
  });

  it('does not render a subtitle when omitted', () => {
    renderComponent({ subtitle: undefined });
    expect(screen.queryByText('Long-press a message to pin it to the chat')).toBeNull();
  });

  it('honors a custom container style override from the theme', () => {
    const customTheme = {
      ...defaultTheme,
      emptyList: {
        container: { backgroundColor: 'rgb(255, 0, 0)' },
        subtitle: {},
        title: {},
      },
    };

    render(
      <ThemeProvider theme={customTheme}>
        <EmptyList icon={Pin} title='Empty' />
      </ThemeProvider>,
    );

    const container = screen.getByTestId('empty-list');
    const flattened = Array.isArray(container.props.style)
      ? Object.assign({}, ...container.props.style.flat(Infinity).filter(Boolean))
      : container.props.style;
    expect(flattened.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('honors custom title and subtitle style overrides from the theme', () => {
    const customTheme = {
      ...defaultTheme,
      emptyList: {
        container: {},
        subtitle: { color: 'rgb(0, 0, 255)' },
        title: { color: 'rgb(0, 255, 0)' },
      },
    };

    render(
      <ThemeProvider theme={customTheme}>
        <EmptyList icon={Pin} subtitle='Subtitle' title='Title' />
      </ThemeProvider>,
    );

    const flatten = (node: { props: { style: unknown } }) =>
      Array.isArray(node.props.style)
        ? Object.assign({}, ...(node.props.style as unknown[]).flat(Infinity).filter(Boolean))
        : node.props.style;

    const title = screen.getByText('Title') as unknown as { props: { style: unknown } };
    const subtitle = screen.getByText('Subtitle') as unknown as { props: { style: unknown } };

    expect((flatten(title) as { color?: string }).color).toBe('rgb(0, 255, 0)');
    expect((flatten(subtitle) as { color?: string }).color).toBe('rgb(0, 0, 255)');
  });
});
