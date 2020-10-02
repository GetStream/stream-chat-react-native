import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { CloseButton } from '../CloseButton';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';

describe('CloseButton', () => {
  it('should render a CloseButton', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <CloseButton />
      </ThemeProvider>,
    );

    await waitFor(() => expect(queryByTestId('close-button')).toBeTruthy());
  });
});
