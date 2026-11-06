import structuredClone from '@ungap/structured-clone';

(function () {
  if (!window.structuredClone) {
    window.structuredClone = structuredClone;
  }
  if (!Array.prototype.at) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'at', {
      configurable: true,
      enumerable: false,
      value: function at(index: number) {
        const len = this.length;
        let relativeIndex = Number(index) || 0;

        if (relativeIndex < 0) {
          relativeIndex += len;
        }

        if (relativeIndex < 0 || relativeIndex >= len) {
          return undefined;
        }

        return this[relativeIndex];
      },
      writable: true,
    });
  }
})();
