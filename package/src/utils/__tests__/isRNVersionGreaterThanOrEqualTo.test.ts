import { Platform } from 'react-native';

import { isRNVersionGreaterThanOrEqualTo } from '../isRNVersionGreaterThanOrEqualTo';

const setRNVersion = (version?: { major: number; minor: number; patch: number }) => {
  Object.defineProperty(Platform, 'constants', {
    configurable: true,
    get: () => (version ? { reactNativeVersion: version } : {}),
  });
};

describe('isRNVersionGreaterThanOrEqualTo', () => {
  const originalConstants = Platform.constants;

  afterEach(() => {
    Object.defineProperty(Platform, 'constants', {
      configurable: true,
      get: () => originalConstants,
    });
  });

  it('compares the major version first', () => {
    setRNVersion({ major: 1, minor: 0, patch: 0 });
    expect(isRNVersionGreaterThanOrEqualTo('0.99.99')).toBe(true);

    setRNVersion({ major: 0, minor: 99, patch: 99 });
    expect(isRNVersionGreaterThanOrEqualTo('1.0.0')).toBe(false);
  });

  it('compares the minor version when majors match', () => {
    setRNVersion({ major: 0, minor: 86, patch: 0 });
    expect(isRNVersionGreaterThanOrEqualTo('0.85.9')).toBe(true);
    expect(isRNVersionGreaterThanOrEqualTo('0.87.0')).toBe(false);
  });

  it('takes the patch version into account when major and minor match', () => {
    setRNVersion({ major: 0, minor: 86, patch: 2 });
    expect(isRNVersionGreaterThanOrEqualTo('0.86.1')).toBe(true);
    expect(isRNVersionGreaterThanOrEqualTo('0.86.2')).toBe(true);
    expect(isRNVersionGreaterThanOrEqualTo('0.86.3')).toBe(false);
  });

  it('treats an exactly-equal version as satisfied', () => {
    setRNVersion({ major: 0, minor: 86, patch: 1 });
    expect(isRNVersionGreaterThanOrEqualTo('0.86.1')).toBe(true);
  });

  it('defaults omitted target parts to 0 (e.g. "0.86" means "0.86.0")', () => {
    setRNVersion({ major: 0, minor: 86, patch: 0 });
    expect(isRNVersionGreaterThanOrEqualTo('0.86')).toBe(true);

    setRNVersion({ major: 0, minor: 86, patch: 1 });
    expect(isRNVersionGreaterThanOrEqualTo('0.86')).toBe(true);
  });

  it('returns false when the RN version constant is unavailable', () => {
    setRNVersion(undefined);
    expect(isRNVersionGreaterThanOrEqualTo('0.86.0')).toBe(false);
  });
});
