// MessageActionList.test.tsx

import React from 'react';

import { Text } from 'react-native';

import { render } from '@testing-library/react-native';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { MessageActionList } from '../MessageActionList';
import type { MessageActionListProps } from '../MessageActionList';
import { MessageActionListItemProps } from '../MessageActionListItem';

const MockMessageActionListItem = (props: MessageActionListItemProps) => <Text>{props.title}</Text>;

const defaultProps: MessageActionListProps & {
  MessageActionListItem: typeof MockMessageActionListItem;
} = {
  MessageActionListItem: MockMessageActionListItem,
  messageActions: [
    { action: jest.fn(), actionType: 'copyMessage', type: 'standard', title: 'Copy Message' },
    {
      action: jest.fn(),
      actionType: 'deleteMessage',
      type: 'destructive',
      title: 'Delete Message',
    },
  ],
};

describe('MessageActionList', () => {
  it('should render correctly with provided message actions', () => {
    const { getByLabelText, getByText } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageActionList {...defaultProps} />
      </ThemeProvider>,
    );

    expect(getByLabelText('Message action list')).toBeTruthy();

    expect(getByText('Copy Message')).toBeTruthy();
    expect(getByText('Delete Message')).toBeTruthy();
  });

  it('should pass the correct props to MessageActionListItem', () => {
    const { getByText } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageActionList {...defaultProps} />
      </ThemeProvider>,
    );

    expect(getByText('Copy Message')).toBeTruthy();
    expect(getByText('Delete Message')).toBeTruthy();
  });

  it('passes each group its own index and length', () => {
    const itemProps: Record<string, unknown>[] = [];
    const RecordingItem = (props: MessageActionListItemProps) => {
      itemProps.push(props as unknown as Record<string, unknown>);
      return <Text>{props.title}</Text>;
    };
    const action = jest.fn();

    render(
      <WithComponents overrides={{ MessageActionListItem: RecordingItem }}>
        <ThemeProvider theme={defaultTheme}>
          <MessageActionList
            messageActions={[
              { action, actionType: 'copyMessage', title: 'Copy', type: 'standard' },
              { action, actionType: 'reply', title: 'Reply', type: 'standard' },
              { action, actionType: 'editMessage', title: 'Edit', type: 'standard' },
              { action, actionType: 'deleteMessage', title: 'Delete', type: 'destructive' },
            ]}
          />
        </ThemeProvider>
      </WithComponents>,
    );

    expect(itemProps.map(({ index, length, title }) => ({ index, length, title }))).toEqual([
      { index: 0, length: 3, title: 'Copy' },
      { index: 1, length: 3, title: 'Reply' },
      { index: 2, length: 3, title: 'Edit' },
      { index: 0, length: 1, title: 'Delete' },
    ]);
  });
});
