/**
 * A GIVEN / WHEN / THEN step, like `step("...") { }` on Android and `GIVEN("...") { }` on iOS.
 * A failure is reported with the step it happened in.
 */
export const step = async (name: string, body: () => PromiseLike<unknown>) => {
  try {
    await body();
  } catch (error) {
    if (error instanceof Error) {
      error.message = `[${name}] ${error.message}`;
    }
    throw error;
  }
};
