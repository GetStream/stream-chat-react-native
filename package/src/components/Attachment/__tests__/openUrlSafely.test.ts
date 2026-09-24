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

    jest.spyOn(Linking, 'openURL').mockImplementation();
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

    jest.spyOn(Linking, 'openURL').mockImplementation();
    const url = 'google.com';
    await openUrlSafely(url);
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('http://google.com');
    });
  });

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
  ])('should do nothing when the url is %s', async (_, url) => {
    jest.spyOn(Linking, 'canOpenURL').mockImplementation(jest.fn().mockResolvedValue(true));
    jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn());

    await openUrlSafely(url);

    expect(Linking.canOpenURL).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
