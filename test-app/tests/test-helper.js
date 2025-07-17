import Application from '#app/app.js';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

export function start() {
  setApplication(
    Application.create({
      autoboot: false,
      element: '#ember-testing',
    })
  );

  setup(QUnit.assert);
  setupEmberOnerrorValidation();

  qunitStart();
}
