/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 */

import 'zone.js';  // Included with Angular CLI.

// Polyfills pour SockJS et Webpack 5
(window as any).global = window;
(window as any).process = {
  env: {},
  version: '',
  nextTick: function (fn: () => void) {
    setTimeout(fn, 0);
  }
};

// Polyfill pour Buffer
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = {
    isBuffer: () => false
  };
}
