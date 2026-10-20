/**
 * Base for the fluent robots. Native robots chain synchronous calls
 * (`userRobot.login().openChannel()`); Detox is async, so each call queues its action and
 * returns `this`, and awaiting the robot runs the queue:
 *
 *   await userRobot.login().openChannel().assertMessage('Hi');
 *
 * A failed action rejects the awaited chain and skips the rest of it.
 */
export abstract class Robot implements PromiseLike<void> {
  private queue: Promise<void> = Promise.resolve();

  /** Queues `action` after the previous ones. Used by the robots and their assert extensions. */
  perform(action: () => Promise<unknown>): this {
    this.queue = this.queue.then(async () => {
      await action();
    });
    return this;
  }

  sleep(ms: number): this {
    return this.perform(() => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const queue = this.queue;
    this.queue = Promise.resolve();
    return queue.then(onfulfilled, onrejected);
  }
}
