import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { Demo } from 'test-app/components/demo.gjs';

module('Rendering | Demo', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    await render(Demo);

    assert.dom().hasText('hi');
  });
});
