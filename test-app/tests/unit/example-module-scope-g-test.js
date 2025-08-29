import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { numbers } from '../utils.js';

import { numbers as n } from 'test-app/tests/utils';

const staticObject = {
  foo: {
    one() {
      return n.one;
    },
  },
  bar: {
    one() {
      return numbers.one;
    },
  },
};

module('module-scope-e', function (hooks) {
  setupTest(hooks);

  test('working', function (assert) {
    assert.strictEqual(staticObject.foo.one(), 1);
    assert.strictEqual(staticObject.bar.one(), 1);
  });
});
