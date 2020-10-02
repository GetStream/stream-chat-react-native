import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AttachButton } from '../AttachButton';

describe('AttachButton', () => {
  it('should render an enabled AttachButton', async () => {
    const handleOnPress = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <AttachButton handleOnPress={handleOnPress} />,
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
      <AttachButton disabled handleOnPress={handleOnPress} />,
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
});
