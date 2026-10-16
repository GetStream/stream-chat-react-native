import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Markdown, mergeThemes, StreamTheme } from '../index';

const mockSetString = jest.fn();
jest.mock(
  '@react-native-clipboard/clipboard',
  () => ({ __esModule: true, default: { setString: (text: string) => mockSetString(text) } }),
  { virtual: true },
);

const renderMarkdown = (text: string, props: Partial<React.ComponentProps<typeof Markdown>> = {}) =>
  render(
    <StreamTheme>
      <Markdown {...props}>{text}</Markdown>
    </StreamTheme>,
  );

describe('ai-components Markdown', () => {
  beforeEach(() => {
    mockSetString.mockClear();
  });

  it('renders headings, emphasis, lists and links', () => {
    const onLink = jest.fn();
    renderMarkdown(
      '# Title\n\nSome **bold** and *italic* and ~~gone~~ text.\n\n- one\n- two\n\n1. first\n2. second\n\n[docs](https://getstream.io)',
      { onLink },
    );

    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('bold')).toBeTruthy();
    expect(screen.getByText('italic')).toBeTruthy();
    expect(screen.getByText('one')).toBeTruthy();
    expect(screen.getByText('second')).toBeTruthy();

    fireEvent.press(screen.getByText('docs'));
    expect(onLink).toHaveBeenCalledWith('https://getstream.io');
  });

  it('renders tables, block quotes, inline code and horizontal rules', () => {
    renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\n\n> quoted\n\nuse `npm i`\n\n---\n\nafter');

    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('quoted')).toBeTruthy();
    expect(screen.getByText('npm i')).toBeTruthy();
    expect(screen.getByText('after')).toBeTruthy();
  });

  it('renders a code block with its language and copies its content', () => {
    renderMarkdown('```js\nconst a = 1;\n```');

    expect(screen.getByText('js')).toBeTruthy();
    expect(screen.getByText(/const/)).toBeTruthy();

    fireEvent.press(screen.getByText('\u29C9'));
    expect(mockSetString).toHaveBeenCalledWith('const a = 1;');
  });

  it('renders a mermaid pie chart instead of a code block', () => {
    renderMarkdown('```mermaid\npie\n"Dogs" : 3\n"Cats" : 2\n```');

    expect(screen.getByTestId('victory-polar-chart')).toBeTruthy();
    expect(screen.getByText('Dogs')).toBeTruthy();
    expect(screen.queryByText('mermaid')).toBeNull();
  });

  it('renders a vega-lite JSON chart, and falls back to code for other JSON', () => {
    const chart = JSON.stringify({
      data: { values: [{ a: 'A', b: 1 }] },
      encoding: { x: { field: 'a' }, y: { field: 'b' } },
      mark: 'bar',
    });
    renderMarkdown('```json\n' + chart + '\n```');
    expect(screen.getByTestId('victory-cartesian-chart')).toBeTruthy();

    renderMarkdown('```json\n{ "hello": "world" }\n```');
    expect(screen.getByText('json')).toBeTruthy();
  });

  it('applies theme overrides', () => {
    const theme = mergeThemes({ style: { markdown: { text: { color: 'rgb(1, 2, 3)' } } } });
    render(
      <StreamTheme mergedStyle={theme}>
        <Markdown>{'# Themed'}</Markdown>
      </StreamTheme>,
    );

    expect(screen.getByText('Themed')).toHaveStyle({ color: 'rgb(1, 2, 3)' });
  });
});
