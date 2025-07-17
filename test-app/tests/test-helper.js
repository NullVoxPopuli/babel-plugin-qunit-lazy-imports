import {
  currentRouteName,
  currentURL,
  getSettledState,
  resetOnerror,
  setApplication,
  visit,
} from '@ember/test-helpers';
import { getPendingWaiterState } from '@ember/test-waiters';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import { setupEmberOnerrorValidation, start as qunitStart } from 'ember-qunit';
import { getGlobalConfig } from '@embroider/macros/src/addon/runtime';

import Application from '#app/app.js';
import config, { enterTestMode } from '#config';

Object.assign(window, {
  visit,
  getSettledState,
  getPendingWaiterState,
  currentURL,
  currentRouteName,
  snapshotTimers: (label) => {
    console.debug(
      label ?? 'snapshotTimers',
      JSON.parse(
        JSON.stringify({
          settled: getSettledState(),
          waiters: getPendingWaiterState(),
        })
      )
    );
  },
});

export function start() {
  enterTestMode();

  const macros = getGlobalConfig()['@embroider/macros'];

  if (macros) macros.isTesting = true;

  setApplication(Application.create(config.APP));
  setup(QUnit.assert);
  setupEmberOnerrorValidation();

  QUnit.moduleStart(({ name }) => console.group(name));
  QUnit.testStart(({ name }) => console.group(name));
  QUnit.testDone(() => console.groupEnd());
  QUnit.moduleDone(() => console.groupEnd());

  QUnit.testStart(() => {
    localStorage.clear();
  });
  QUnit.testDone(resetOnerror);

  qunitStart();
}
