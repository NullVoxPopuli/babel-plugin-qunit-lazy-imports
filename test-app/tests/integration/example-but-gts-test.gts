import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import { Demo } from '#app/components/demo.gjs';

module('Rendering (GTS) | Demo', function (hooks) {
  setupRenderingTest(hooks);

  test('it works', async function (assert) {
    await render(<template><Demo /></template>);

    assert.dom('span').hasText('hi');
  });
});
