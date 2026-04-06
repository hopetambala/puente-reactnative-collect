/**
 * Jest mock for ModernCard component
 */

import React from 'react';

module.exports = {
  __esModule: true,
  default: ({ children, ...props }) => React.createElement('View', props, children),
};
