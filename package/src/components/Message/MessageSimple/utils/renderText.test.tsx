import React from 'react';
import { Text } from 'react-native';

import type { ReactTestInstance } from 'react-test-renderer';

import { render, waitFor, within } from '@testing-library/react-native';

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

  it('renders numbered items', () => {
    const node = createNode({ amount: 3, ordered: true, start: 1 });
    const { container } = render(<MockText node={node} output={mockOutput} state={{}} />);
    const textInstances = container.children as ReactTestInstance[];
    textInstances.forEach(async (instance, index) => {
      const text = `${index + node.start}. `; // 1. , 2. ...
      await waitFor(() => expect(within(instance).getByText(text)).toBeTruthy());
    });
  });

  it('renders numbered items from a start index', () => {
    const node = createNode({ amount: 3, ordered: true, start: 3 });
    const { container } = render(<MockText node={node} output={mockOutput} state={{}} />);
    const textInstances = container.children as ReactTestInstance[];
    textInstances.forEach(async (instance, index) => {
      const text = `${index + node.start}. `; // 3. , 4. ...
      await waitFor(() => expect(within(instance).getByText(text)).toBeTruthy());
    });
  });

  it('does not throw an error if an item is empty', () => {
    const node = {
      ...createNode({ amount: 3, ordered: true }),
      items: ['Not empty', null, 'Not empty'],
    };
    const { container } = render(<MockText node={node} output={mockOutput} state={{}} />);
    const textInstances = container.children as ReactTestInstance[];
    textInstances.forEach(async (instance, index) => {
      const text = `${index + 1}. `; // 1. , 2. ...
      await waitFor(() => expect(within(instance).getByText(text)).toBeTruthy());
    });
  });

  it('renders an unordered list', () => {
    const node = createNode({ amount: 3 });
    const { container } = render(<MockText node={node} output={mockOutput} state={{}} />);
    const textInstances = container.children as ReactTestInstance[];
    textInstances.forEach(async (instance) => {
      await waitFor(() => expect(within(instance).getByText('\u2022 ')).toBeTruthy());
    });
  });
});
