import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import CloseButton from '../CloseButton';

describe('CloseButton', () => {
  it('should render a CloseButton', async () => {
    const { queryByTestId } = render(<CloseButton />);

    await waitFor(() => expect(queryByTestId('close-button')).toBeTruthy());
  });
});
