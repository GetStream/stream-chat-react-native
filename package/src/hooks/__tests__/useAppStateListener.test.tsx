import { AppState } from 'react-native';

import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';

import { useAppStateListener } from '../useAppStateListener';

describe('useAppStateListener', () => {
  it('detects foreground and background correctly', async () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
    AppState.currentState = 'active';
    const hookResult = renderHook(() => useAppStateListener(onForeground, onBackground));
    const appStateOnChangeMockFunc = addEventListenerSpy.mock.calls[0][1];
    const { remove: appStateOnChangeSubscriptionRemoveMockFunc } =
      addEventListenerSpy.mock.results[0].value;
    appStateOnChangeMockFunc('background');
    await waitFor(() => {
      expect(onBackground).toHaveBeenCalled();
    });
    appStateOnChangeMockFunc('active');
    await waitFor(() => {
      expect(onForeground).toHaveBeenCalled();
    });
    appStateOnChangeMockFunc('inactive');
    await waitFor(() => {
      expect(onBackground).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(appStateOnChangeSubscriptionRemoveMockFunc).not.toHaveBeenCalled();
    });
    hookResult.unmount();
    await waitFor(() => {
      expect(appStateOnChangeSubscriptionRemoveMockFunc).toHaveBeenCalled();
    });
  });
});
