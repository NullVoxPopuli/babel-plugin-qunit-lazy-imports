import QUnit, { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { numbers } from '../utils.js';

import { numbers as n } from 'test-app/tests/utils';

function assertOne() {
  QUnit.assert.strictEqual(n.one, 1);
  QUnit.assert.strictEqual(numbers.one, 1);
}

module('module-scope-c (1)', function (hooks) {
  setupTest(hooks);

  test('working', function () {
    assertOne();
  });
});

module('module-scope-c (2)', function (hooks) {
  setupTest(hooks);

  test('working', function (assert) {
    assert.strictEqual(n.one, 1);
  });
});
