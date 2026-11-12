type Format = typeof import('../internal/format');

const loadFormat = () => {
  let format: Format | undefined;
  jest.isolateModules(() => {
    format = require('../internal/format');
  });
  return format as Format;
};

describe('formatCallDuration', () => {
  afterEach(() => jest.restoreAllMocks());

  it('writes narrow units', () => {
    const { formatCallDuration, formatMinutesAndSeconds } = loadFormat();
    expect(formatCallDuration(0.42)).toBe('0.4s');
    expect(formatCallDuration(65)).toBe('1m 5s');
    expect(formatMinutesAndSeconds(120)).toBe('2m');
  });

  it('writes the same where Intl ignores the narrow width, as Hermes on iOS does', () => {
    jest
      .spyOn(Intl, 'NumberFormat')
      .mockImplementation(
        () => ({ format: (value: number) => `${value} sec` }) as unknown as Intl.NumberFormat,
      );
    const { formatCallDuration, formatMinutesAndSeconds } = loadFormat();
    expect(formatCallDuration(0.42)).toBe('0.4s');
    expect(formatCallDuration(65)).toBe('1m 5s');
    expect(formatMinutesAndSeconds(7)).toBe('7s');
  });
});
