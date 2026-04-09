/**
 * Jest mock for ModernCard component
 */

// eslint-disable-next-line global-require
const React = require('react');

module.exports = {
  __esModule: true,
  default: ({ children, ...props }) => React.createElement('View', props, children),
};
