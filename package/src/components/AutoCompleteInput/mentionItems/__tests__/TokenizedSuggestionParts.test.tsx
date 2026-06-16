import React from 'react';

import { cleanup, render } from '@testing-library/react-native';

import { TokenizedSuggestionParts } from '../TokenizedSuggestionParts';

describe('TokenizedSuggestionParts', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the fallback when no tokenized payload is provided', () => {
    const { getByText } = render(<TokenizedSuggestionParts fallback='Jane Doe' />);
    expect(getByText('Jane Doe')).toBeTruthy();
  });

  it('renders nothing when neither tokenized payload nor fallback is provided', () => {
    const { toJSON } = render(<TokenizedSuggestionParts />);
    expect(toJSON()).toBeNull();
  });

  it('renders all parts when the tokenized payload is present', () => {
    const { queryByText } = render(
      <TokenizedSuggestionParts tokenizedDisplayName={{ parts: ['Al', 'i', 'ce'], token: 'i' }} />,
    );
    // The full name still reads through because RN concatenates nested Text children.
    expect(queryByText('Alice')).toBeTruthy();
  });

  it('wraps the matched part in a separate Text node so it can be styled', () => {
    const matchStyle = { fontWeight: 'bold' as const };
    const { UNSAFE_root } = render(
      <TokenizedSuggestionParts
        matchStyle={matchStyle}
        tokenizedDisplayName={{ parts: ['Al', 'ice', 'son'], token: 'ice' }}
      />,
    );
    // The matched substring is rendered inside a nested Text — the only one
    // carrying our matchStyle — so the count of styled descendants equals the
    // number of matching parts (case-insensitive).
    const matchedNodes = UNSAFE_root.findAll(
      (node) =>
        typeof node.type !== 'string' &&
        Array.isArray(node.props?.style) === false &&
        node.props?.style === matchStyle,
    );
    expect(matchedNodes.length).toBe(1);
  });

  it('matches case-insensitively', () => {
    const matchStyle = { fontWeight: 'bold' as const };
    const { UNSAFE_root } = render(
      <TokenizedSuggestionParts
        matchStyle={matchStyle}
        tokenizedDisplayName={{ parts: ['Channel'], token: 'channel' }}
      />,
    );
    const matchedNodes = UNSAFE_root.findAll(
      (node) => typeof node.type !== 'string' && node.props?.style === matchStyle,
    );
    expect(matchedNodes.length).toBe(1);
  });
});
