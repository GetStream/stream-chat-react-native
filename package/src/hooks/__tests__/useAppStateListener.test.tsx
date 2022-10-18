import { AppState } from 'react-native';

import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';

import { useAppStateListener } from '../useAppStateListener';

describe('useAppStateListener', () => {
  it('detects foreground and background correctly', async () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();
    const appStateSpy = jest.spyOn(AppState, 'addEventListener');
    AppState.currentState = 'active';
    renderHook(() => useAppStateListener(onForeground, onBackground));
    const appStateMockCall = appStateSpy.mock.calls[0][1];
    appStateMockCall('background');
    await waitFor(() => {
      expect(onBackground).toHaveBeenCalled();
    });
    appStateMockCall('active');
    await waitFor(() => {
      expect(onForeground).toHaveBeenCalled();
    });
    appStateMockCall('inactive');
    await waitFor(() => {
      expect(onBackground).toHaveBeenCalled();
    });
  });
});
