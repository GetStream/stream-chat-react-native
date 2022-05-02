import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { ProgressIndicatorTypes } from '../../../utils/utils';
import { UploadProgressIndicator } from '../UploadProgressIndicator';

describe('UploadProgressIndicator', () => {
  it('should render an inactive UploadProgressIndicator', async () => {
    const action = jest.fn();

    const { queryByTestId, toJSON } = render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.INACTIVE}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeFalsy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeTruthy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an active UploadProgressIndicator', async () => {
    const action = jest.fn();

    const { queryByTestId, toJSON } = render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.IN_PROGRESS}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an active UploadProgressIndicator and not-supported indicator', async () => {
    const action = jest.fn();

    const { queryByTestId, toJSON } = render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.NOT_SUPPORTED}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('not-supported-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an active UploadProgressIndicator and in-progress indicator', async () => {
    const action = jest.fn();

    const { queryByTestId, toJSON } = render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.IN_PROGRESS}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an active UploadProgressIndicator and retry indicator', async () => {
    const action = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.RETRY}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('upload-progress-indicator')).toBeFalsy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(queryByTestId('retry-upload-progress-indicator')).toBeTruthy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('retry-upload-progress-indicator'));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
