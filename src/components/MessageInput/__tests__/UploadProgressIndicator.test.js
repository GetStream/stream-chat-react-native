import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import UploadProgressIndicator from '../UploadProgressIndicator';

import { ProgressIndicatorTypes } from '../../../utils';

describe('UploadProgressIndicator', () => {
  it('should render an inactive IN_PROGRESS UploadProgressIndicator', async () => {
    const action = jest.fn();

    const { queryByTestId, toJSON } = render(
      <UploadProgressIndicator
        action={action}
        type={ProgressIndicatorTypes.IN_PROGRESS}
      ></UploadProgressIndicator>,
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
      <UploadProgressIndicator
        action={action}
        type={ProgressIndicatorTypes.RETRY}
      ></UploadProgressIndicator>,
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

    const { getByTestId, queryByTestId, toJSON } = render(
      <UploadProgressIndicator
        action={action}
        active
        type={ProgressIndicatorTypes.IN_PROGRESS}
      ></UploadProgressIndicator>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('active-upload-progress-indicator'));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render an active RETRY UploadProgressIndicator', async () => {
    const action = jest.fn();

    const { getByTestId, queryByTestId, toJSON } = render(
      <UploadProgressIndicator
        action={action}
        active
        type={ProgressIndicatorTypes.RETRY}
      ></UploadProgressIndicator>,
    );

    await waitFor(() => {
      expect(queryByTestId('active-upload-progress-indicator')).toBeTruthy();
      expect(queryByTestId('inactive-upload-progress-indicator')).toBeFalsy();
      expect(action).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('active-upload-progress-indicator'));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
