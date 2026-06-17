import React from 'react';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import { FileAttachmentListSectionHeader } from '../../navigation-section/FileAttachmentListSectionHeader';

describe('FileAttachmentListSectionHeader', () => {
  it('renders the provided title', () => {
    render(
      <ThemeProvider theme={defaultTheme}>
        <FileAttachmentListSectionHeader title='March 2026' />
      </ThemeProvider>,
    );

    expect(screen.getByText('March 2026')).toBeTruthy();
  });
});
