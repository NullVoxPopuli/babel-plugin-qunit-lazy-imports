import { it, expect } from "vitest";

import { transform } from "./helpers.js";

it("excludes are always", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';
      import { setupTest } from 'fancy-app/tests/helpers';

      module('Acceptance | test', function (hooks) {
        setupTest(hooks);

        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing)
        });
      });
`,
      {
        startsWith: ["fancy-app/"],
        excludes: {
          startsWith: ["fancy-app/tests/"],
        },
      },
    ),
  ).toMatchInlineSnapshot(`
    "import { visit, currentURL } from '@ember/test-helpers';
    import { module, test } from 'qunit';
    let someFancyThing;
    import { setupTest } from 'fancy-app/tests/helpers';
    module('Acceptance | test', function (hooks) {
      hooks.before(async () => {
        await Promise.all([(async () => {
          let module = await import('fancy-app/some/path');
          someFancyThing = module.default;
        })()]);
      });
      setupTest(hooks);
      test('should work', async function (assert) {
        await visit('/');
        assert.strictEqual(currentURL(), '/');
        console.log(someFancyThing);
      });
    });"
  `);
});
