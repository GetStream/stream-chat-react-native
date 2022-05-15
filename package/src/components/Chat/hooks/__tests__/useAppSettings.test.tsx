import React from 'react';
import { Text } from 'react-native';

import { render, waitFor } from '@testing-library/react-native';

import type { StreamChat } from 'stream-chat';

import { useAppSettings } from '../useAppSettings';

describe('useAppSettings', () => {
  it('will return a settings object if the backend call is successful', async () => {
    const TestComponent = () => {
      const isOnline = true;
      const appSettings = useAppSettings(
        {
          getAppSettings: jest.fn().mockReturnValue(
            Promise.resolve({
              auto_translation_enabled: true,
            }),
          ),
        } as unknown as StreamChat,
        isOnline,
      );

      return <Text>{JSON.stringify(appSettings)}</Text>;
    };

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText(JSON.stringify({ auto_translation_enabled: true }))).toBeTruthy();
    });
  });
});
