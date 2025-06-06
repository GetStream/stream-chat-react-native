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
        // Convert to integer if index is not provided
        const len = this.length;
        let relativeIndex = Number(index) || 0;

        // Handle negative indices
        if (relativeIndex < 0) {
          relativeIndex += len;
        }

        // Return undefined if index is out of bounds
        if (relativeIndex < 0 || relativeIndex >= len) {
          return undefined;
        }

        // Return the element at the calculated index
        return this[relativeIndex];
      },
      writable: true,
    });
  }
})();
