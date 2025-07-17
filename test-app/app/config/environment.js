import { getGlobalConfig } from '@embroider/macros/src/addon/runtime';

const ENV = {
  modulePrefix: 'test-app',
  environment: import.meta.env.DEV ? 'development' : 'production',
  rootURL: '/',
  locationType: 'history',
  EmberENV: {},
  APP: {},
};

// ENV.APP.LOG_RESOLVER = true;
// ENV.APP.LOG_ACTIVE_GENERATION = true;
// ENV.APP.LOG_TRANSITIONS = true;
// ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
// ENV.APP.LOG_VIEW_LOOKUPS = true;

export default ENV;

export function enterTestMode() {
  ENV.locationType = 'none';
  ENV.APP.rootElement = '#ember-testing';
  ENV.APP.autoboot = false;

  const config = getGlobalConfig()['@embroider/macros'];

  if (config) config.isTesting = true;
}
