import React from 'react';
import { Platform, View } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { registerNativeHandlers } from '../../native';
import {
  cssToRNTextStyle,
  flattenRowsToTextAndColorRanges,
  generateNewStylesheet,
  StreamTheme,
  SyntaxHighlighter,
} from '../index';

const setPlatform = (os: typeof Platform.OS) =>
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });

describe('ai-components syntax highlighting', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    setPlatform(originalOS);
    registerNativeHandlers({ PerfText: null as unknown as undefined });
  });

  it('converts web CSS into React Native text styles', () => {
    expect(
      cssToRNTextStyle({
        color: '#fff',
        font: 'italic bold 14px/20px "Fira Code", monospace',
        letterSpacing: '0.5em',
        overflow: 'auto',
      }),
    ).toEqual({
      color: '#fff',
      fontFamily: 'Fira Code',
      fontSize: 14,
      fontStyle: 'italic',
      fontWeight: 'bold',
      letterSpacing: 8,
      lineHeight: 20,
      overflow: 'scroll',
    });
    expect(
      cssToRNTextStyle({ fontSize: '1.5em', lineHeight: 'nope' }, { baseFontSize: 10 }),
    ).toEqual({
      fontSize: 15,
    });
  });

  it('flattens highlighted rows into one text with merged colour ranges', () => {
    const { defaultColor, transformedStyle } = generateNewStylesheet({
      highlighter: 'prism',
      stylesheet: {
        'pre[class*="language-"]': { color: '#111111' },
        keyword: { color: '#ff0000' },
      },
    });
    expect(defaultColor).toBe('#111111');

    const rows = [
      [
        {
          children: [{ type: 'text', value: 'const' }],
          properties: { className: ['token', 'keyword'] },
          tagName: 'span',
          type: 'element',
        },
        { type: 'text', value: ' a = 1;' },
      ],
      [{ type: 'text', value: 'next' }],
    ] as unknown as rendererNode[];

    const { ranges, text } = flattenRowsToTextAndColorRanges(rows, {
      defaultColor: defaultColor as string,
      // The renderer passes the converted stylesheet through react-syntax-highlighter untyped.
      stylesheet: transformedStyle as unknown as Parameters<
        typeof flattenRowsToTextAndColorRanges
      >[1]['stylesheet'],
    });

    expect(text).toBe('const a = 1;\nnext');
    expect(ranges).toHaveLength(3);
    expect(ranges[0]).toMatchObject({ end: 5, start: 0 });
    expect(ranges[1]).toMatchObject({ end: 12, start: 5 });
    expect(ranges[2]).toMatchObject({ end: 17, start: 13 });
  });

  it('renders nested Text on iOS', () => {
    setPlatform('ios');
    render(
      <StreamTheme>
        <SyntaxHighlighter highlighter='prism' language='javascript'>
          {'const a = 1;'}
        </SyntaxHighlighter>
      </StreamTheme>,
    );

    expect(screen.getByText('const')).toBeTruthy();
  });

  it('renders a single PerfText on Android', () => {
    setPlatform('android');
    const MockPerfText = jest.fn((props) => <View testID='perf-text' {...props} />);
    registerNativeHandlers({ PerfText: MockPerfText });

    render(
      <StreamTheme>
        <SyntaxHighlighter highlighter='prism' language='javascript'>
          {'const a = 1;'}
        </SyntaxHighlighter>
      </StreamTheme>,
    );

    expect(screen.getByTestId('perf-text')).toBeTruthy();
    expect(MockPerfText.mock.calls[0]?.[0]).toMatchObject({ text: 'const a = 1;' });
  });
});
