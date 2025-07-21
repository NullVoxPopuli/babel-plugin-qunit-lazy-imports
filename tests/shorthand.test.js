import { it, expect } from "vitest";

import { transform } from "./helpers.js";

it("works with arrows", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';

      module('Acceptance | test', (hooks) => {
        test('should work', async  (assert) => {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing)
        });
      });
`,
      {
        startsWith: ["fancy-app/"],
      },
    ),
  ).toMatchInlineSnapshot(`
    "import { visit, currentURL } from '@ember/test-helpers';
    import { module, test } from 'qunit';
    let someFancyThing;
    module('Acceptance | test', hooks => {
      hooks.before(async () => {
        await Promise.all([(async () => {
          let module = await import('fancy-app/some/path');
          someFancyThing = module.default;
        })()]);
      });
      test('should work', async assert => {
        await visit('/');
        assert.strictEqual(currentURL(), '/');
        console.log(someFancyThing);
      });
    });"
  `);
});
