import QUnit, { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { numbers } from '../utils.js';

import { numbers as n } from 'test-app/tests/utils';

function assertOne() {
  QUnit.assert.strictEqual(n.one, 1);
  QUnit.assert.strictEqual(numbers.one, 1);
}

module('module-scope-b', function (hooks) {
  setupTest(hooks);

  test('working', function () {
    assertOne();
  });
});
