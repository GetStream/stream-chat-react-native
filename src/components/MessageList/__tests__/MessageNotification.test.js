import React from 'react';
import {
  cleanup,
  render,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';

import MessageNotification from '../MessageNotification';

afterEach(cleanup);

describe('MessageNotification', () => {
  it('should render nothing if showNotification is false', async () => {
    const { queryByTestId } = render(
      <MessageNotification showNotification={false} onPress={() => null} />,
    );

    await waitFor(() => {
      expect(queryByTestId('message-notification')).toBeFalsy();
    });
  });

  it('should render if showNotification is true', async () => {
    const { queryByTestId } = render(
      <MessageNotification showNotification={true} onPress={() => null} />,
    );

    await waitFor(() => {
      expect(queryByTestId('message-notification')).toBeTruthy();
    });
  });

  it('should trigger onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MessageNotification showNotification={true} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('message-notification'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should display the text New Messages', async () => {
    const t = jest.fn((key) => key);
    const { getByText } = render(
      <MessageNotification
        showNotification={true}
        onPress={() => null}
        t={t}
      />,
    );
    expect(t).toHaveBeenCalledWith('New Messages');
    await waitFor(() => {
      expect(getByText('New Messages')).toBeTruthy();
    });
  });

  it('should render the message notification and match snapshot', async () => {
    const { toJSON } = render(
      <MessageNotification showNotification={true} onPress={() => null} />,
    );

    /**
     * Wait for animation to finish
     */
    await new Promise((r) => setTimeout(r, 500));
    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
