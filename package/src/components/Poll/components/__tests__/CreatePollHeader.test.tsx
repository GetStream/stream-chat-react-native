import React from 'react';

import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts';
import { CreatePollHeader } from '../CreatePollHeader';

jest.mock('../../hooks/useCanCreatePoll', () => ({
  useCanCreatePoll: jest.fn(() => true),
}));

const getCloseButtonWrapperStyle = () => {
  const closeButton = screen.getAllByRole('button')[0];
  let node = closeButton;

  while (node.parent) {
    const style = StyleSheet.flatten(node.parent.props.style as StyleProp<ViewStyle>);
    if (style?.height === 40 && style.width === 40) {
      return style;
    }
    node = node.parent;
  }

  throw new Error('Create poll header close button wrapper not found');
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

describe('CreatePollHeader', () => {
  it('renders a secondary outline cross close button', () => {
    render(
      <ThemeProvider>
        <CreatePollHeader onBackPressHandler={jest.fn()} onCreatePollPressHandler={jest.fn()} />
      </ThemeProvider>,
    );

    const style = getCloseButtonWrapperStyle();
    expect(style.backgroundColor).toBeUndefined();
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBeDefined();
    expect(collectPathData(screen.toJSON())).toContain(
      'M15.625 4.375L4.375 15.625M15.625 15.625L4.375 4.375',
    );
  });
});
