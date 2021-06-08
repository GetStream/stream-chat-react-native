import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { FileUploadPreview } from '../FileUploadPreview';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { FileState } from '../../../utils/utils';

import { generateFileUploadPreview } from '../../../mock-builders/generator/attachment';

describe('FileUploadPreview', () => {
  it('should render FileUploadPreview with all uploading files', async () => {
    const fileUploads = [
      generateFileUploadPreview({ state: FileState.UPLOADING }),
      generateFileUploadPreview({ state: FileState.UPLOADING }),
      generateFileUploadPreview({ state: FileState.UPLOADING }),
    ];
    const removeFile = jest.fn();
    const retryUpload = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <FileUploadPreview
          fileUploads={fileUploads}
          removeFile={removeFile}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(fileUploads.length);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(fileUploads.length);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(0);
      expect(removeFile).toHaveBeenCalledTimes(0);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-file-upload-preview')[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledTimes(1);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <FileUploadPreview
          fileUploads={fileUploads.map((file, index) => ({
            ...file,
            id: `${index}`,
          }))}
          removeFile={removeFile}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render FileUploadPreview with all uploaded files', async () => {
    const fileUploads = [
      generateFileUploadPreview({ state: FileState.UPLOADED }),
      generateFileUploadPreview({ state: FileState.UPLOADED }),
      generateFileUploadPreview({ state: FileState.UPLOADED }),
    ];
    const removeFile = jest.fn();
    const retryUpload = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <FileUploadPreview
          fileUploads={fileUploads}
          removeFile={removeFile}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(
        fileUploads.length,
      );
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(0);
      expect(removeFile).toHaveBeenCalledTimes(0);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-file-upload-preview')[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledTimes(1);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <FileUploadPreview
          fileUploads={fileUploads.map((file, index) => ({
            ...file,
            id: `${index}`,
          }))}
          removeFile={removeFile}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render FileUploadPreview with all failed files', async () => {
    const fileUploads = [
      generateFileUploadPreview({ state: FileState.UPLOAD_FAILED }),
      generateFileUploadPreview({ state: FileState.UPLOAD_FAILED }),
      generateFileUploadPreview({ state: FileState.UPLOAD_FAILED }),
    ];
    const removeFile = jest.fn();
    const retryUpload = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <FileUploadPreview
          fileUploads={fileUploads}
          removeFile={removeFile}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(fileUploads.length);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(fileUploads.length);
      expect(removeFile).toHaveBeenCalledTimes(0);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-file-upload-preview')[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledTimes(1);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('retry-upload-progress-indicator')[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledTimes(1);
      expect(retryUpload).toHaveBeenCalledTimes(1);
    });

    rerender(
      <ThemeProvider>
        <FileUploadPreview
          fileUploads={fileUploads.map((file, index) => ({
            ...file,
            id: `${index}`,
          }))}
          removeFile={removeFile}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render FileUploadPreview with 1 uploading, 1 uploaded, and 1 failed file', async () => {
    const fileUploads = [
      generateFileUploadPreview({ state: FileState.UPLOADING }),
      generateFileUploadPreview({ state: FileState.UPLOADED }),
      generateFileUploadPreview({ state: FileState.UPLOAD_FAILED }),
    ];
    const removeFile = jest.fn();
    const retryUpload = jest.fn();

    const { queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <FileUploadPreview
          fileUploads={fileUploads}
          removeFile={removeFile}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        fileUploads.length - 1,
      );
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(1);
      expect(removeFile).toHaveBeenCalledTimes(0);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <FileUploadPreview
          fileUploads={fileUploads.map((file, index) => ({
            ...file,
            id: `${index}`,
          }))}
          removeFile={removeFile}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
