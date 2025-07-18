import { it, expect } from "vitest";

import { transform } from "./helpers.js";

it("inserts the hooks.before", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';

      module('Acceptance | test', function () {
        test('should work', async function (assert) {
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
    });"
  `);
});

it("inserts the hooks.before when arrow", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';

      module('Acceptance | test', () => {
        test('should work', async function (assert) {
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
    module('Acceptance | test', (hooks) => {
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
    });"
  `);
});

it("avoids 'redeclaration of const'", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';

      module('Acceptance | test', function () {
        test('should work', async function (assert) {
          const hooks = '/whatever';
          await visit(hooks);
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
    module('Acceptance | test', function (hooks2) {
      hooks2.before(async () => {
        await Promise.all([(async () => {
          let module = await import('fancy-app/some/path');
          someFancyThing = module.default;
        })()]);
      });
      test('should work', async function (assert) {
        const hooks = '/whatever';
        await visit(hooks);
        assert.strictEqual(currentURL(), '/');
        console.log(someFancyThing);
      });
    });"
  `);
});
