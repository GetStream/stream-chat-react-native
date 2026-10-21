import React from 'react';
import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { FileIcon } from '../FileIcon';

const renderFileIcon = (mimeType: string) =>
  render(
    <WithComponents
      overrides={{
        icons: {
          DOC: () => <Text>doc</Text>,
          OtherFileIcon: () => <Text>other</Text>,
          SpreadSheet: () => <Text>spreadsheet</Text>,
        },
      }}
    >
      <ThemeProvider theme={defaultTheme}>
        <FileIcon mimeType={mimeType} />
      </ThemeProvider>
    </WithComponents>,
  );

describe('FileIcon', () => {
  it.each([
    ['application/vnd.ms-excel.addin.macroEnabled.12'],
    ['application/vnd.ms-excel.sheet.binary.macroEnabled.12'],
  ])('shows the spreadsheet icon for %s', (mimeType) => {
    renderFileIcon(mimeType);
    expect(screen.getByText('spreadsheet')).toBeTruthy();
  });

  it('shows the document icon for an OpenDocument text', () => {
    renderFileIcon('application/vnd.oasis.opendocument.text');
    expect(screen.getByText('doc')).toBeTruthy();
  });

  it('falls back to the generic icon for an unknown type', () => {
    renderFileIcon('application/x-unknown');
    expect(screen.getByText('other')).toBeTruthy();
  });
});
