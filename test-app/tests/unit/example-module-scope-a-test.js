import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { numbers } from '../utils.js';

import { numbers as n } from 'test-app/tests/utils';

module('Unit module-scope-a', function (hooks) {
  setupTest(hooks);

  test('working', function (assert) {
    assert.strictEqual(numbers.one, 1);
    assert.strictEqual(n.one, 1);
  });
});
