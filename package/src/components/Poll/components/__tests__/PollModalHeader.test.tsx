import React from 'react';

import { Platform, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts';
import { PollModalHeader } from '../PollModalHeader';

const originalPlatform = Platform.OS;

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
};

const getCloseButtonWrapperStyle = () => {
  let node = screen.getByTestId('poll-results-close-button');

  while (node.parent) {
    const style = StyleSheet.flatten(node.parent.props.style as StyleProp<ViewStyle>);
    if (style?.height === 40 && style.width === 40) {
      return style;
    }
    node = node.parent;
  }

  throw new Error('Poll modal header close button wrapper not found');
};

const collectPathData = (node: unknown): string[] => {
  if (!node || typeof node !== 'object') {
    return [];
  }

  if (Array.isArray(node)) {
    return node.reduce<string[]>((acc, child) => [...acc, ...collectPathData(child)], []);
  }

  const { children, props } = node as {
    children?: unknown;
    props?: { d?: unknown };
  };

  return [...(typeof props?.d === 'string' ? [props.d] : []), ...collectPathData(children)];
};

const renderPollModalHeader = () =>
  render(
    <ThemeProvider>
      <PollModalHeader onPress={jest.fn()} title='Poll Results' />
    </ThemeProvider>,
  );

describe('PollModalHeader', () => {
  afterEach(() => {
    setPlatform(originalPlatform);
  });

  it('renders a secondary outline cross button outside Android', () => {
    setPlatform('ios');

    renderPollModalHeader();

    const style = getCloseButtonWrapperStyle();
    expect(style.backgroundColor).toBeUndefined();
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBeDefined();
    expect(collectPathData(screen.toJSON())).toContain(
      'M15.625 4.375L4.375 15.625M15.625 15.625L4.375 4.375',
    );
  });

  it('renders a secondary outline cross button on Android', () => {
    setPlatform('android');

    renderPollModalHeader();

    const style = getCloseButtonWrapperStyle();
    expect(style.backgroundColor).toBeUndefined();
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBeDefined();
    expect(collectPathData(screen.toJSON())).toContain(
      'M15.625 4.375L4.375 15.625M15.625 15.625L4.375 4.375',
    );
  });
});
