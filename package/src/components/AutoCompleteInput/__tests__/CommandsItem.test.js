import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { CommandsItem } from '../CommandsItem';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';

const args = 'a string list of args';
const name = 'giphy';

describe('CommandsItem', () => {
  it('should render CommandsItem with no avatar image but a name', async () => {
    const { getByTestId, queryByTestId } = render(
      <ThemeProvider>
        <CommandsItem item={{ args, name }} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('commands-item-title')).toBeTruthy();
      expect(queryByTestId('commands-item-args')).toBeTruthy();
      expect(getByTestId('commands-item-title')).toHaveTextContent('Giphy');
      expect(getByTestId('commands-item-args')).toHaveTextContent(args);
    });
  });
});
