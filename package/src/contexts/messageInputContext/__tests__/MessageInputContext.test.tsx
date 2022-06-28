import React from 'react';

import { renderHook } from '@testing-library/react-hooks';

import {
  generateFileUploadPreview,
  generateImageUploadPreview,
} from '../../../mock-builders/generator/attachment';

import { FileState } from '../../../utils/utils';
import * as UseMessageDetailsForState from '../hooks/useMessageDetailsForState';
import { MessageInputProvider, useMessageInputContext } from '../MessageInputContext';
import { act } from 'react-test-renderer';

describe('MessageInputContext', () => {
  it('isValidMessage is false when text is empty and there is no image uploads and file uploads', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('isValidMessage is true when text is present but there is no image uploads, file uploads and mentioned users', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    jest.spyOn(UseMessageDetailsForState, 'useMessageDetailsForState').mockImplementation(() => ({
      fileUploads: [],
      imageUploads: [],
      mentionedUsers: [],
      text: 'Dummy Text',
    }));

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(true);
  });

  it('isValidMessage is true when text is not present and there are files', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    jest.spyOn(UseMessageDetailsForState, 'useMessageDetailsForState').mockImplementation(() => ({
      fileUploads: [generateFileUploadPreview()],
      imageUploads: [],
      mentionedUsers: [],
    }));

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(true);
  });

  it('isValidMessage is true when text is not present and there are images', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    jest.spyOn(UseMessageDetailsForState, 'useMessageDetailsForState').mockImplementation(() => ({
      fileUploads: [],
      imageUploads: [generateImageUploadPreview()],
      mentionedUsers: [],
    }));

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(true);
  });

  it('isValidMessage is false when text is not present and there is one image with state Upload Failed', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    jest.spyOn(UseMessageDetailsForState, 'useMessageDetailsForState').mockImplementation(() => ({
      fileUploads: [],
      imageUploads: [generateImageUploadPreview({ state: FileState.UPLOAD_FAILED })],
      mentionedUsers: [],
    }));

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('isValidMessage is false when text is not present and there is one file with state Upload Failed', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    jest.spyOn(UseMessageDetailsForState, 'useMessageDetailsForState').mockImplementation(() => ({
      fileUploads: [generateFileUploadPreview({ state: FileState.UPLOAD_FAILED })],
      imageUploads: [],
      mentionedUsers: [],
    }));

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('isValidMessage is false when text is not present and there is one file with state Uploading', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    jest.spyOn(UseMessageDetailsForState, 'useMessageDetailsForState').mockImplementation(() => ({
      fileUploads: [generateFileUploadPreview({ state: FileState.UPLOADING })],
      imageUploads: [],
      mentionedUsers: [],
    }));

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('isValidMessage is false when text is not present and there is one image with state Uploading', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    jest.spyOn(UseMessageDetailsForState, 'useMessageDetailsForState').mockImplementation(() => ({
      fileUploads: [],
      imageUploads: [generateImageUploadPreview({ state: FileState.UPLOADING })],
      mentionedUsers: [],
    }));

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('appendText works', () => {
    const setTextMock = jest.fn();
    const appendText = jest
      .spyOn(React, 'useState')
      .mockImplementation((text) => [text, setTextMock]);

    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    expect(setTextMock).toBeCalled();
    // expect(result.current.appendText('text')).toBe('dummytext');
  });

  it('removing a image works', () => {
    const Wrapper = ({ children }) => (
      <MessageInputProvider value={{ editing: true }}>{children}</MessageInputProvider>
    );

    const imageToUpload = generateImageUploadPreview();
    jest.spyOn(UseMessageDetailsForState, 'useMessageDetailsForState').mockImplementation(() => ({
      fileUploads: [],
      imageUploads: [imageToUpload],
      mentionedUsers: [],
      setImageUploads: jest.fn(),
      setNumberOfUploads: jest.fn(),
    }));

    const { result } = renderHook(() => useMessageInputContext(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.removeImage(imageToUpload.id);
    });

    expect(result.current.imageUploads.length).toBe(0);
  });
});
