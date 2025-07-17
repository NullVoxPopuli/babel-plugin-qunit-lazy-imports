import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { visit, currentURL } from '@ember/test-helpers';

module('Acceptance | example js test', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /example-js', async function (assert) {
    await visit('/example-js');

    assert.strictEqual(currentURL(), '/example-js', 'The URL is correct');
    assert.dom('h1').hasText('Example JS Test', 'The header text is correct');
    assert.dom('.content').exists('The content section is present');
  });
});
