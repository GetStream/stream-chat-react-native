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

const collectTransforms = (node: unknown): string[] => {
  if (!node || typeof node !== 'object') {
    return [];
  }

  if (Array.isArray(node)) {
    return node.reduce<string[]>((acc, child) => [...acc, ...collectTransforms(child)], []);
  }

  const { children, props } = node as {
    children?: unknown;
    props?: { style?: StyleProp<ViewStyle>; transform?: unknown };
  };
  const style = StyleSheet.flatten(props?.style);
  const styleTransforms = Array.isArray(style?.transform)
    ? style.transform.flatMap((transform) => {
        if (
          transform &&
          typeof transform === 'object' &&
          'rotate' in transform &&
          typeof transform.rotate === 'string'
        ) {
          return [transform.rotate];
        }
        return [];
      })
    : [];

  return [
    ...(typeof props?.transform === 'string' ? [props.transform] : []),
    ...styleTransforms,
    ...collectTransforms(children),
  ];
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

  it('renders a secondary ghost arrow-left button outside Android', () => {
    setPlatform('ios');

    renderPollModalHeader();

    const style = getCloseButtonWrapperStyle();
    expect(style.backgroundColor).toBeUndefined();
    expect(style.borderWidth).toBeUndefined();
    expect(style.borderColor).toBeUndefined();
    expect(collectPathData(screen.toJSON())).toContain(
      'M10 16.875V3.125M10 3.125L4.375 8.75M10 3.125L15.625 8.75',
    );
    expect(collectTransforms(screen.toJSON())).toContain('-90deg');
  });

  it('renders a secondary ghost arrow-left button on Android', () => {
    setPlatform('android');

    renderPollModalHeader();

    const style = getCloseButtonWrapperStyle();
    expect(style.backgroundColor).toBeUndefined();
    expect(style.borderWidth).toBeUndefined();
    expect(style.borderColor).toBeUndefined();
    expect(collectPathData(screen.toJSON())).toContain(
      'M10 16.875V3.125M10 3.125L4.375 8.75M10 3.125L15.625 8.75',
    );
    expect(collectTransforms(screen.toJSON())).toContain('-90deg');
  });
});
