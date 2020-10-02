import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { SendButton } from '../SendButton';

import { MessagesProvider } from '../../../contexts/messagesContext/MessagesContext';

describe('SendButton', () => {
  it('should render a non-editing enabled SendButton', async () => {
    const sendMessage = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <MessagesProvider value={{ editing: false }}>
        <SendButton sendMessage={sendMessage} />
      </MessagesProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('send-button'));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render a non-editing disabled SendButton', async () => {
    const sendMessage = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <MessagesProvider value={{ editing: false }}>
        <SendButton disabled sendMessage={sendMessage} />
      </MessagesProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('send-button'));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(0));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an editing enabled SendButton', async () => {
    const sendMessage = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <MessagesProvider value={{ editing: true }}>
        <SendButton sendMessage={sendMessage} />
      </MessagesProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('send-button'));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an editing disabled SendButton', async () => {
    const sendMessage = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <MessagesProvider value={{ editing: true }}>
        <SendButton disabled sendMessage={sendMessage} />
      </MessagesProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('send-button'));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(0));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
