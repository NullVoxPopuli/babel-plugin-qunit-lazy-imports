import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | example-js', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:example-js');
    assert.ok(route);
  });
});
