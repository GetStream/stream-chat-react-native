import React from 'react';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { ProgressIndicatorTypes } from '../../../utils/utils';
import { UploadProgressIndicator } from '../UploadProgressIndicator';

describe('UploadProgressIndicator', () => {
  it('should render an inactive UploadProgressIndicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.INACTIVE}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeFalsy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeTruthy();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  it('should render an active UploadProgressIndicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.IN_PROGRESS}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  it('should render an active UploadProgressIndicator and not-supported indicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.NOT_SUPPORTED}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('not-supported-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  it('should render an active UploadProgressIndicator and in-progress indicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.IN_PROGRESS}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  it('should render an active UploadProgressIndicator and retry indicator', async () => {
    const action = jest.fn();
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.RETRY}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('upload-progress-indicator')).toBeFalsy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(screen.queryByTestId('retry-upload-progress-indicator')).toBeTruthy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    user.press(screen.getByTestId('retry-upload-progress-indicator'));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });
});
