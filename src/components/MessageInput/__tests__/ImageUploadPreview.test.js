import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ImageUploadPreview } from '../ImageUploadPreview';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { FileState } from '../../../utils/utils';

import { generateImageUploadPreview } from '../../../mock-builders/generator/attachment';

describe('ImageUploadPreview', () => {
  it('should render ImageUploadPreview with all uploading images', async () => {
    const imageUploads = [
      generateImageUploadPreview({ state: FileState.UPLOADING }),
      generateImageUploadPreview({ state: FileState.UPLOADING }),
      generateImageUploadPreview({ state: FileState.UPLOADING }),
    ];
    const removeImage = jest.fn();
    const retryUpload = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads}
          removeImage={removeImage}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        imageUploads.length,
      );
      expect(
        queryAllByTestId('inactive-upload-progress-indicator'),
      ).toHaveLength(0);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(
        imageUploads.length,
      );
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(
        0,
      );
      expect(removeImage).toHaveBeenCalledTimes(0);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-image-upload-preview')[0]);

    await waitFor(() => {
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads.map((image, index) => ({
            ...image,
            id: `${index}`,
          }))}
          removeImage={removeImage}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render ImageUploadPreview with all uploaded images', async () => {
    const imageUploads = [
      generateImageUploadPreview({ state: FileState.UPLOADED }),
      generateImageUploadPreview({ state: FileState.UPLOADED }),
      generateImageUploadPreview({ state: FileState.UPLOADED }),
    ];
    const removeImage = jest.fn();
    const retryUpload = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads}
          removeImage={removeImage}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        0,
      );
      expect(
        queryAllByTestId('inactive-upload-progress-indicator'),
      ).toHaveLength(imageUploads.length);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(
        0,
      );
      expect(removeImage).toHaveBeenCalledTimes(0);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-image-upload-preview')[0]);

    await waitFor(() => {
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads.map((image, index) => ({
            ...image,
            id: `${index}`,
          }))}
          removeImage={removeImage}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render ImageUploadPreview with all failed images', async () => {
    const imageUploads = [
      generateImageUploadPreview({ state: FileState.UPLOAD_FAILED }),
      generateImageUploadPreview({ state: FileState.UPLOAD_FAILED }),
      generateImageUploadPreview({ state: FileState.UPLOAD_FAILED }),
    ];
    const removeImage = jest.fn();
    const retryUpload = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads}
          removeImage={removeImage}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        imageUploads.length,
      );
      expect(
        queryAllByTestId('inactive-upload-progress-indicator'),
      ).toHaveLength(0);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(
        imageUploads.length,
      );
      expect(removeImage).toHaveBeenCalledTimes(0);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-image-upload-preview')[0]);

    await waitFor(() => {
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('retry-upload-progress-indicator')[0]);

    await waitFor(() => {
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(retryUpload).toHaveBeenCalledTimes(1);
    });

    rerender(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads.map((image, index) => ({
            ...image,
            id: `${index}`,
          }))}
          removeImage={removeImage}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render ImageUploadPreview with 1 uploading, 1 uploaded, and 1 failed image', async () => {
    const imageUploads = [
      generateImageUploadPreview({ state: FileState.UPLOADING }),
      generateImageUploadPreview({ state: FileState.UPLOADED }),
      generateImageUploadPreview({ state: FileState.UPLOAD_FAILED }),
    ];
    const removeImage = jest.fn();
    const retryUpload = jest.fn();

    const { queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads}
          removeImage={removeImage}
          retryUpload={retryUpload}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        imageUploads.length - 1,
      );
      expect(
        queryAllByTestId('inactive-upload-progress-indicator'),
      ).toHaveLength(1);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(
        1,
      );
      expect(removeImage).toHaveBeenCalledTimes(0);
      expect(retryUpload).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads.map((image, index) => ({
            ...image,
            id: `${index}`,
          }))}
          removeImage={removeImage}
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
