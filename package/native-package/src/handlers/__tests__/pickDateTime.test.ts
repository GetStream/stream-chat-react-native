describe('pickDateTime', () => {
  const pick = jest.fn();
  const dismiss = jest.fn();

  const loadHandler = () => {
    // `__esModule: true` keeps the handler's default import from double-wrapping the mock.
    jest.doMock('../../native/NativeStreamDateTimePicker', () => ({
      __esModule: true,
      default: { dismiss, pick },
    }));
    return require('../pickDateTime').pickDateTime as typeof import('../pickDateTime').pickDateTime;
  };

  const options = (signal?: AbortSignal) => ({
    cancelLabel: 'Cancel',
    confirmLabel: 'Confirm',
    mode: 'date' as const,
    signal,
    value: new Date(1_700_000_000_000),
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('resolves with the picked moment', async () => {
    pick.mockResolvedValue(1_700_000_060_000);

    await expect(loadHandler()(options())).resolves.toEqual(new Date(1_700_000_060_000));
    expect(pick).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'date', value: 1_700_000_000_000 }),
    );
  });

  it('closes the picker when the signal aborts, and resolves with null', async () => {
    let resolvePick: (value: number | null) => void = () => undefined;
    pick.mockImplementation(() => new Promise((resolve) => (resolvePick = resolve)));
    dismiss.mockImplementation(() => resolvePick(null));
    const controller = new AbortController();

    const result = loadHandler()(options(controller.signal));
    controller.abort();

    await expect(result).resolves.toBeNull();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('opens nothing when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(loadHandler()(options(controller.signal))).resolves.toBeNull();
    expect(pick).not.toHaveBeenCalled();
  });

  it('leaves the next picker alone when aborted after settling', async () => {
    pick.mockResolvedValue(null);
    const controller = new AbortController();

    await loadHandler()(options(controller.signal));
    controller.abort();

    expect(dismiss).not.toHaveBeenCalled();
  });
});
