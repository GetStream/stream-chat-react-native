import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { MessagesProvider } from '../../../contexts/messagesContext/MessagesContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { SendButton } from '../SendButton';

describe('SendButton', () => {
  const getComponent = ({ editing, ...rest } = {}) => (
    <ThemeProvider>
      <MessagesProvider value={{ editing }}>
        <SendButton {...rest} />
      </MessagesProvider>
    </ThemeProvider>
  );

  it('should render a non-editing enabled SendButton', async () => {
    const sendMessage = jest.fn();

    const { getByA11yLabel, queryAllByA11yLabel, toJSON } = render(
      getComponent({ editing: false, sendMessage }),
    );

    await waitFor(() => {
      expect(queryAllByA11yLabel('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByA11yLabel('send-button'));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render a non-editing disabled SendButton', async () => {
    const sendMessage = jest.fn();

    const { getByA11yLabel, queryByA11yLabel, toJSON } = render(
      getComponent({ disabled: true, editing: false, sendMessage }),
    );

    await waitFor(() => {
      expect(queryByA11yLabel('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByA11yLabel('send-button'));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(0));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an editing enabled SendButton', async () => {
    const sendMessage = jest.fn();

    const { getByA11yLabel, queryByA11yLabel, toJSON } = render(
      getComponent({ editing: true, sendMessage }),
    );

    await waitFor(() => {
      expect(queryByA11yLabel('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByA11yLabel('send-button'));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an editing disabled SendButton', async () => {
    const sendMessage = jest.fn();

    const { getByA11yLabel, queryByA11yLabel, toJSON } = render(
      getComponent({ disabled: true, editing: true, sendMessage }),
    );

    await waitFor(() => {
      expect(queryByA11yLabel('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByA11yLabel('send-button'));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(0));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
