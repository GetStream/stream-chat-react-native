import React from 'react';
import { Text } from 'react-native';

import { render, waitFor } from '@testing-library/react-native';

// @ts-ignore
import { ASTNode, SingleASTNode } from 'simple-markdown';

import { ListOutput, ListOutputProps } from './renderText';

describe('list', () => {
  const createNode = ({
    amount,
    ordered = false,
    start = 1,
  }: {
    amount: number;
    ordered?: boolean;
    start?: number;
  }): SingleASTNode => ({
    items: Array.from(Array(amount).keys()),
    ordered,
    start,
    type: 'text',
  });

  const mockOutput = (node: ASTNode) => <Text>{node}</Text>;
  const MockText = ({ node, output, state }: ListOutputProps) => (
    <>
      <ListOutput node={node} output={output} state={state} styles={{}} />
    </>
  );

  it('renders numbered items', async () => {
    const node = createNode({ amount: 3, ordered: true, start: 1 });
    const { getByText } = render(<MockText node={node} output={mockOutput} state={{}} />);

    await waitFor(() => expect(getByText('1. ')).toBeTruthy());
    await waitFor(() => expect(getByText('2. ')).toBeTruthy());
    await waitFor(() => expect(getByText('3. ')).toBeTruthy());
  });

  it('renders numbered items from a start index', async () => {
    const node = createNode({ amount: 3, ordered: true, start: 3 });
    const { getByText } = render(<MockText node={node} output={mockOutput} state={{}} />);

    await waitFor(() => expect(getByText('3. ')).toBeTruthy());
    await waitFor(() => expect(getByText('4. ')).toBeTruthy());
    await waitFor(() => expect(getByText('5. ')).toBeTruthy());
  });

  it('does not throw an error if an item is empty', async () => {
    const node = {
      ...createNode({ amount: 3, ordered: true }),
      items: ['Not empty', null, 'Not empty'],
    };
    const { getByText } = render(<MockText node={node} output={mockOutput} state={{}} />);

    await waitFor(() => expect(getByText('1. ')).toBeTruthy());
    await waitFor(() => expect(getByText('2. ')).toBeTruthy());
    await waitFor(() => expect(getByText('3. ')).toBeTruthy());
  });

  it('renders an unordered list', async () => {
    const node = createNode({ amount: 3 });
    const { getAllByText } = render(<MockText node={node} output={mockOutput} state={{}} />);

    await waitFor(() => expect(getAllByText('\u2022 ')).toHaveLength(3));
  });
});
