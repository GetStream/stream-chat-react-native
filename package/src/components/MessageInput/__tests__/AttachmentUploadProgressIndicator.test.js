import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { ProgressIndicatorTypes } from '../../../utils/utils';

import { AttachmentUploadProgressIndicator } from '../components/AttachmentPreview/AttachmentUploadProgressIndicator';

describe('AttachmentUploadProgressIndicator', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render an inactive AttachmentUploadProgressIndicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <AttachmentUploadProgressIndicator
          onPress={action}
          type={ProgressIndicatorTypes.INACTIVE}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeFalsy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeTruthy();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  it('should render an active AttachmentUploadProgressIndicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <AttachmentUploadProgressIndicator
          onPress={action}
          type={ProgressIndicatorTypes.IN_PROGRESS}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  it('should render an active AttachmentUploadProgressIndicator and not-supported indicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <AttachmentUploadProgressIndicator
          onPress={action}
          type={ProgressIndicatorTypes.NOT_SUPPORTED}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('not-supported-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  it('should render an active AttachmentUploadProgressIndicator and in-progress indicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <AttachmentUploadProgressIndicator
          onPress={action}
          type={ProgressIndicatorTypes.IN_PROGRESS}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });
  });

  it('should render an active AttachmentUploadProgressIndicator and retry indicator', async () => {
    const action = jest.fn();

    render(
      <ThemeProvider>
        <AttachmentUploadProgressIndicator onPress={action} type={ProgressIndicatorTypes.RETRY} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(screen.queryByTestId('upload-progress-indicator')).toBeFalsy();
      expect(screen.queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(screen.queryByTestId('retry-upload-progress-indicator')).toBeTruthy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    act(() => {
      fireEvent.press(screen.getByTestId('retry-upload-progress-indicator'));
    });

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });
});
