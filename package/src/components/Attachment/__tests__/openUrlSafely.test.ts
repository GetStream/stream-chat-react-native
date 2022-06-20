import { Linking } from 'react-native';

import { waitFor } from '@testing-library/react-native';

import { openUrlSafely } from '../utils/openUrlSafely';

describe('openUrlSafely', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should open a valid url', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockImplementation(jest.fn().mockResolvedValue(true));
    jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn());

    const url = 'https://www.google.com';
    await openUrlSafely(url);
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalled();
    });
  });

  it('should not call openUrl if url is not supported', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockImplementation(jest.fn().mockResolvedValue(false));
    jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn());

    Linking.openURL = jest.fn();
    const url = 'basjkdbkjasbdkjabskdjabsjkdbasjkda---asdkjasjkdabsk';
    await openUrlSafely(url);
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(Linking.openURL).not.toHaveBeenCalled();
    });
  });

  it('should append http if missing', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockImplementation(jest.fn());
    jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn());

    Linking.openURL = jest.fn();
    const url = 'google.com';
    await openUrlSafely(url);
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('http://google.com');
    });
  });
});
