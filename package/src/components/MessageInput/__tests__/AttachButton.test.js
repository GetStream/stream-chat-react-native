import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { AttachButton } from '../AttachButton';

describe('AttachButton', () => {
  it('should render an enabled AttachButton', async () => {
    const handleOnPress = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <OverlayProvider>
        <ThemeProvider>
          <Chat>
            <Channel>
              <AttachButton handleOnPress={handleOnPress} />
            </Channel>
          </Chat>
        </ThemeProvider>
      </OverlayProvider>,
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
      <OverlayProvider>
        <ThemeProvider>
          <Chat>
            <Channel>
              <AttachButton disabled handleOnPress={handleOnPress} />
            </Channel>
          </Chat>
        </ThemeProvider>
      </OverlayProvider>,
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
