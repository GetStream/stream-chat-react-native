import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { UploadProgressIndicator } from '../UploadProgressIndicator';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { ProgressIndicatorTypes } from '../../../utils/utils';

describe('UploadProgressIndicator', () => {
  it('should render an inactive IN_PROGRESS UploadProgressIndicator', async () => {
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
      expect(queryByTestId('active-upload-progress-indicator')).toBeFalsy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeTruthy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an inactive RETRY UploadProgressIndicator', async () => {
    const action = jest.fn();

    const { queryByTestId, toJSON } = render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          type={ProgressIndicatorTypes.RETRY}
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

  it('should render an active IN_PROGRESS UploadProgressIndicator', async () => {
    const action = jest.fn();

    const { queryByTestId, toJSON } = render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          active
          type={ProgressIndicatorTypes.IN_PROGRESS}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(queryByTestId('upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('retry-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an active RETRY UploadProgressIndicator', async () => {
    const action = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <ThemeProvider>
        <UploadProgressIndicator
          action={action}
          active
          type={ProgressIndicatorTypes.RETRY}
        ></UploadProgressIndicator>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(queryByTestId('upload-progress-indicator')).toBeFalsy();
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
