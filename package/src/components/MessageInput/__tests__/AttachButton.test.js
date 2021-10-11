import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AttachButton } from '../AttachButton';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { SendButton } from '../SendButton';

describe('AttachButton', () => {
  it('should render an enabled AttachButton', async () => {
    const handleOnPress = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <ThemeProvider>
        <AttachButton handleOnPress={handleOnPress} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
      expect(handleOnPress).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('attach-button'));

    await waitFor(() => expect(handleOnPress).toHaveBeenCalledTimes(1));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render a disabled AttachButton', async () => {
    const handleOnPress = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <ThemeProvider>
        <AttachButton disabled handleOnPress={handleOnPress} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
      expect(handleOnPress).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('attach-button'));

    await waitFor(() => expect(handleOnPress).toHaveBeenCalledTimes(0));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render a cooldown timer while slow mode is active', async () => {
    const { getByTestId, queryByTestId, toJSON } = render(
      <ThemeProvider>
        <SendButton />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(queryByTestId('send-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('send-button'));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
