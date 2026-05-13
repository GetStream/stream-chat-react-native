import React from 'react';

import { render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../../contexts';
import { Button } from '../Button';

describe('Button accessibilityLabelKey', () => {
  it('uses the translated accessibility label when accessibility is enabled', async () => {
    render(
      <OverlayProvider accessibility={{ enabled: true }}>
        <Button
          accessibilityLabelKey='a11y/Add attachment'
          iconOnly
          onPress={jest.fn()}
          size='md'
          type='outline'
          variant='secondary'
        />
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Add attachment')).toBeTruthy();
    });
  });

  it('supports a plain accessibilityLabel without the translation path', () => {
    render(
      <OverlayProvider>
        <Button
          accessibilityLabel='Legacy label'
          iconOnly
          onPress={jest.fn()}
          size='md'
          type='outline'
          variant='secondary'
        />
      </OverlayProvider>,
    );

    expect(screen.getByLabelText('Legacy label')).toBeTruthy();
  });
});
