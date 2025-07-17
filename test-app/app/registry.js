import PageTitleService from 'ember-page-title/services/page-title';

import Router from './router.js';

const appName = 'test-app';

function formatAsResolverEntries(imports) {
  return Object.fromEntries(
    Object.entries(imports).map(([k, v]) => [
      k.replace(/\.g?(j|t)s$/, '').replace(/^\.\//, `${appName}/`),
      v,
    ])
  );
}

/**
 * A global registry is needed until:
 * - Services can be referenced via import paths (rather than strings)
 * - we design a new routing system
 */
const autoRegistry = {
  ...formatAsResolverEntries(
    import.meta.glob('./services/**/*.{js,ts}', { eager: true })
  ),
  ...formatAsResolverEntries(
    import.meta.glob('./routes/**/*.{js,ts}', { eager: true })
  ),
  [`${appName}/router`]: Router,
};

import ApplicationTemplate from './templates/application.gjs';
import ExampleJS from './templates/example-js.gjs';

export const registry = {
  // /////////////////
  // To keep
  // /////////////////
  [`${appName}/services/page-title`]: PageTitleService,
  ...autoRegistry,
  [`${appName}/templates/application`]: ApplicationTemplate,
  [`${appName}/templates/example-js`]: ExampleJS,
};
