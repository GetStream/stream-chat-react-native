import { Unsubscribe } from 'stream-chat';

/**
 * @private
 * Class to use as a template for subscribable entities.
 */
export abstract class WithSubscriptions {
  private unsubscribeFunctions: Set<Unsubscribe> = new Set();
  /**
   * Workaround for the missing TS keyword - ensures that inheritants
   * overriding `unregisterSubscriptions` call the base method and return
   * its unique symbol value.
   */
  private static symbol = Symbol(WithSubscriptions.name);

  public abstract registerSubscriptions(): void;

  /**
   * Returns a boolean, provides information of whether `registerSubscriptions`
   * method has already been called for this instance.
   */
  public get hasSubscriptions() {
    return this.unsubscribeFunctions.size > 0;
  }

  public addUnsubscribeFunction(unsubscribeFunction: Unsubscribe) {
    this.unsubscribeFunctions.add(unsubscribeFunction);
  }

  /**
   * If you re-declare `unregisterSubscriptions` method within your class
   * make sure to run the original too.
   *
   * @example
   * ```ts
   * class T extends WithSubscriptions {
   *  ...
   *  public unregisterSubscriptions = () => {
   *    this.customThing();
   *    return super.unregisterSubscriptions();
   *  }
   * }
   * ```
   */
  public unregisterSubscriptions(): typeof WithSubscriptions.symbol {
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions.clear();

    return WithSubscriptions.symbol;
  }
}
