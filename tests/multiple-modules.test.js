import { it, expect } from "vitest";

import { transform } from "./helpers.js";

it("moves imports from fancy-app when startsWith has been provided", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';

      module('Acceptance | test', function (hooks) {
        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing)
        });
      });

      module('Two test', function (hooks) {
        test('should work', function (assert) {
          visit('/');
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
      module('Acceptance | test', function (hooks) {
        hooks.before(async () => {
          await Promise.all([(async () => {
            let module = await import('fancy-app/some/path');
            someFancyThing = module.default;
          })()]);
        });
        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing);
        });
      });
      module('Two test', function (hooks) {
        hooks.before(async () => {
          await Promise.all([(async () => {
            let module = await import('fancy-app/some/path');
            someFancyThing = module.default;
          })()]);
        });
        test('should work', function (assert) {
          visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing);
        });
      });"
    `);
});
