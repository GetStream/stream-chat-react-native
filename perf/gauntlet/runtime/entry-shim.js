// Loaded in place of SampleApp index.js's first import: installs the probe, then loads the real module.
require('./probe.js');
require('./probe-llc.js');
module.exports = require('gauntlet-real-entry');
