import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { CommandSuggestion } from 'stream-chat';

import {
  AttachmentCommandNativePickerItem,
  AttachmentCommandPickerItem,
} from '../AttachmentPickerContent';

jest.mock('stream-chat', () => ({
  CommandSearchSource: jest.fn(() => ({
    query: jest.fn(() => ({ items: [] })),
  })),
}));

jest.mock('../AttachmentMediaPicker/AttachmentMediaPicker', () => ({
  AttachmentMediaPicker: () => null,
}));

const mockClose = jest.fn((callback?: () => void) => callback?.());
const mockFocus = jest.fn();
const mockIsCommandDisabled = jest.fn();
const mockSetCommand = jest.fn();

jest.mock('../../../../contexts', () => ({
  useAttachmentPickerContext: jest.fn(() => ({
    disableAttachmentPicker: false,
  })),
  useBottomSheetContext: jest.fn(() => ({
    close: mockClose,
  })),
  useMessageComposer: jest.fn(() => ({
    isCommandDisabled: mockIsCommandDisabled,
    textComposer: { setCommand: mockSetCommand },
  })),
  useMessageInputContext: jest.fn(() => ({
    inputBoxRef: { current: { focus: mockFocus } },
  })),
}));

jest.mock('../../../../contexts/themeContext/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: {
      semantics: {
        backgroundUtilityPressed: '#f5f5f5',
      },
    },
  })),
}));

jest.mock('../../../../hooks', () => ({
  useAttachmentPickerState: jest.fn(() => ({ selectedPicker: 'images' })),
  useStableCallback: (callback: unknown) => callback,
}));

jest.mock('../../../AutoCompleteInput/AutoCompleteSuggestionItem', () => {
  const { Text } = require('react-native');

  return {
    CommandSuggestionItem: ({ name }: CommandSuggestion) => <Text>{name}</Text>,
  };
});

const command = {
  args: '',
  id: 'ban',
  name: 'ban',
  set: 'moderation_set',
} as CommandSuggestion;

describe('AttachmentPickerContent commands', () => {
  beforeEach(() => {
    mockClose.mockClear();
    mockFocus.mockClear();
    mockIsCommandDisabled.mockReset();
    mockSetCommand.mockClear();
  });

  it('does not focus the input when a disabled command is pressed', () => {
    mockIsCommandDisabled.mockReturnValue(true);

    render(<AttachmentCommandPickerItem item={command} />);

    fireEvent.press(screen.getByText('ban'));

    expect(mockIsCommandDisabled).toHaveBeenCalledWith(command);
    expect(mockSetCommand).not.toHaveBeenCalled();
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('does not close the picker or focus the input when a disabled command is pressed in native picker mode', () => {
    mockIsCommandDisabled.mockReturnValue(true);

    render(<AttachmentCommandNativePickerItem item={command} />);

    fireEvent.press(screen.getByText('ban'));

    expect(mockIsCommandDisabled).toHaveBeenCalledWith(command);
    expect(mockSetCommand).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
    expect(mockFocus).not.toHaveBeenCalled();
  });
});
