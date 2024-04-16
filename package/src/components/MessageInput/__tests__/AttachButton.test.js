import React from 'react';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { AttachButton } from '../AttachButton';

describe('AttachButton', () => {
  const getComponent = (props = {}) => (
    <ThemeProvider>
      <AttachButton {...props} />
    </ThemeProvider>
  );

  it('should render an enabled AttachButton', async () => {
    const handleOnPress = jest.fn();
    const user = userEvent.setup();

    render(getComponent({ handleOnPress }));

    await waitFor(() => {
      expect(screen.queryByTestId('attach-button')).toBeTruthy();
      expect(handleOnPress).toHaveBeenCalledTimes(0);
    });

    user.press(screen.getByTestId('attach-button'));

    await waitFor(() => expect(handleOnPress).toHaveBeenCalledTimes(1));

    const snapshot = screen.toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render a disabled AttachButton', async () => {
    const handleOnPress = jest.fn();
    const user = userEvent.setup();

    render(getComponent({ disabled: true, handleOnPress }));

    await waitFor(() => {
      expect(screen.queryByTestId('attach-button')).toBeTruthy();
      expect(handleOnPress).toHaveBeenCalledTimes(0);
    });

    user.press(screen.getByTestId('attach-button'));

    await waitFor(() => expect(handleOnPress).toHaveBeenCalledTimes(0));

    const snapshot = screen.toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
