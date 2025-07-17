import { describe, it, expect } from "vitest";

import { transformSync } from "@babel/core";
import qunitLazyImportsPlugin from "../src/index.js";

function transform(code, config) {
  const result = transformSync(code, {
    plugins: [[qunitLazyImportsPlugin, config]],
    parserOpts: {
      sourceType: "module",
    },
  });
  return result.code;
}

describe("The babel plugin", () => {
  it("doesn't change anything if you have not provided a startsWith or matches config", () => {
    expect(
      transform(`
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';

      module('Acceptance | test', function (hooks) {
        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
        });
      });
`),
      {},
    ).toMatchInlineSnapshot(`
  "import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
module('Acceptance | test', function (hooks) {
  test('should work', async function (assert) {
    await visit('/');
    assert.strictEqual(currentURL(), '/');
  });
});"
`);
  });

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
    hooks.beforeAll(async () => {
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

  it("moves named imports correctly", () => {
    expect(
      transform(
        `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing, { otherFancyThing } from 'fancy-app/some/path';

      module('Acceptance | test', function (hooks) {
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
  let otherFancyThing;
  module('Acceptance | test', function (hooks) {
    hooks.beforeAll(async () => {
      await Promise.all([(async () => {
        let module = await import('fancy-app/some/path');
        someFancyThing = module.default;
        otherFancyThing = module.otherFancyThing;
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

  it("moves imports from fancy-app when startsWith has been provided and uses the local name of hooks", () => {
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
        hooks.beforeAll(async () => {
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

  it("does not conflict or mess with existing beforeAll", () => {
    expect(
      transform(
        `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';

      module('Acceptance | test', function (hooks) {
        beforeAll(async () => {
          console.log('I exist');
        });

        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing)
        });
      });
`,
        { startsWith: ["fancy-app/"] },
      ),
    ).toMatchInlineSnapshot(`
      "import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      let someFancyThing;
      module('Acceptance | test', function (hooks) {
        hooks.beforeAll(async () => {
          await Promise.all([(async () => {
            let module = await import('fancy-app/some/path');
            someFancyThing = module.default;
          })()]);
        });
        beforeAll(async () => {
          console.log('I exist');
        });
        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing);
        });
      });"
    `);
  });
});
