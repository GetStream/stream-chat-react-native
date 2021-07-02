module.exports = Promise.resolve()
  .then(() => require('conventional-changelog-angular'))
  .then((preset) => {
    const oldWhatBump = preset.recommendedBumpOpts.whatBump;
    const newWhatBump = (...params) => {
      const result = oldWhatBump(...params);
      if (result.level === 0) {
        return {
          level: 1,
          reason: "Major bump replaced with minor in order to match React Native's versioning spec",
        };
      }
      return result;
    };

    preset.recommendedBumpOpts.whatBump = newWhatBump;

    return preset;
  });
