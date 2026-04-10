/**
 * Cloud Code Entry Point for ParseServer
 * This file is loaded by ParseServer via the `cloud` parameter
 * Use global.Parse to access the Parse instance
 */

// eslint-disable-next-line global-require
const mockCloudCode = require('./mockCloudCode');

// RegisterCloud Code functions when module is loaded
mockCloudCode(global.Parse);
