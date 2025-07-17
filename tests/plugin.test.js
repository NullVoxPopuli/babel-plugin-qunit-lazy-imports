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

  it.only("moves imports from fancy-app when startsWith has been provided", () => {
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

  it.only("moves named imports correctly", () => {
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

  it.skip("moves imports from fancy-app when startsWith has been provided and uses the local name of hooks", () => {
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
  
  module('Acceptance | test', function (localHooksForLocalPeople) {
    localHooksForLocalPeople.beforeAll(async () => {
      someFancyThing = (await import('fancy-app/some/path')).default;
    })
    test('should work', async function (assert) {
      await visit('/');
      assert.strictEqual(currentURL(), '/');
      console.log(someFancyThing);
    });
  });"
`);
  });

  it.skip("moves adds new import to an existing beforeAll", () => {
    expect(
      transform(`
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
`),
      {
        startsWith: "fancy-app/",
      },
    ).toMatchInlineSnapshot(`
  "import { visit, currentURL } from '@ember/test-helpers';
  import { module, test } from 'qunit';
  let someFancyThing;
  
  module('Acceptance | test', function (hooks) {
    beforeAll(async () => {
      console.log('I exist');
      someFancyThing = (await import('fancy-app/some/path')).default;
    })
    test('should work', async function (assert) {
      await visit('/');
      assert.strictEqual(currentURL(), '/');
      console.log(someFancyThing);
    });
  });"
`);
  });

  it.skip("adds new import to an existing beforeAll and makes it async if it wasn't already", () => {
    expect(
      transform(`
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';

      module('Acceptance | test', function (hooks) {
        beforeAll(() => {
          console.log('I exist');
        });

        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing)
        });
      });
`),
      {
        startsWith: "fancy-app/",
      },
    ).toMatchInlineSnapshot(`
  "import { visit, currentURL } from '@ember/test-helpers';
  import { module, test } from 'qunit';
  let someFancyThing;
  
  module('Acceptance | test', function (hooks) {
    beforeAll(async () => {
      console.log('I exist');
      someFancyThing = (await import('fancy-app/some/path')).default;
    })
    test('should work', async function (assert) {
      await visit('/');
      assert.strictEqual(currentURL(), '/');
      console.log(someFancyThing);
    });
  });"
`);
  });
});

// test('transforms default imports to beforeEach', () => {
//   const input = `
// import Component from '@glimmer/component';
// import { module, test } from 'qunit';

// module('Unit | component', function (hooks) {
//   test('should work', function (assert) {
//     assert.ok(new Component());
//   });
// });
// `;

//   const output = transform(input);

//   assert.ok(output.includes('hooks.beforeEach(async () => {'));
//   assert.ok(output.includes('const {'));
//   assert.ok(output.includes('default: Component'));
//   assert.ok(output.includes('} = await import("@glimmer/component");'));
//   assert.ok(!output.includes('import Component from'));
// });

// test('transforms namespace imports to beforeEach', () => {
//   const input = `
// import * as helpers from '@ember/test-helpers';
// import { module, test } from 'qunit';

// module('Acceptance | test', function (hooks) {
//   test('should work', async function (assert) {
//     await helpers.visit('/');
//   });
// });
// `;

//   const output = transform(input);

//   assert.ok(output.includes('hooks.beforeEach(async () => {'));
//   assert.ok(output.includes('const helpers = await import("@ember/test-helpers");'));
//   assert.ok(!output.includes('import * as helpers from'));
// });

// test('transforms mixed default and named imports to beforeEach', () => {
//   const input = `
// import Component, { tracked } from '@glimmer/component';
// import { module, test } from 'qunit';

// module('Unit | component', function (hooks) {
//   test('should work', function (assert) {
//     assert.ok(Component);
//     assert.ok(tracked);
//   });
// });
// `;

//   const output = transform(input);

//   assert.ok(output.includes('hooks.beforeEach(async () => {'));
//   assert.ok(output.includes('const {'));
//   assert.ok(output.includes('default: Component,'));
//   assert.ok(output.includes('tracked'));
//   assert.ok(output.includes('} = await import("@glimmer/component");'));
//   assert.ok(!output.includes('import Component, { tracked } from'));
// });

// test('transforms side-effect imports to beforeEach', () => {
//   const input = `
// import 'qunit-dom';
// import { module, test } from 'qunit';

// module('Acceptance | test', function (hooks) {
//   test('should work', function (assert) {
//     assert.dom('body').exists();
//   });
// });
// `;

//   const output = transform(input);

//   assert.ok(output.includes('hooks.beforeEach(async () => {'));
//   assert.ok(output.includes('await import("qunit-dom");'));
//   assert.ok(!output.includes('import \'qunit-dom\';'));
// });

// test('handles imports with aliases', () => {
//   const input = `
// import { visit as goTo, currentURL as getURL } from '@ember/test-helpers';
// import { module, test } from 'qunit';

// module('Acceptance | test', function (hooks) {
//   test('should work', async function (assert) {
//     await goTo('/');
//     assert.strictEqual(getURL(), '/');
//   });
// });
// `;

//   const output = transform(input);

//   assert.ok(output.includes('hooks.beforeEach(async () => {'));
//   assert.ok(output.includes('visit: goTo,'));
//   assert.ok(output.includes('currentURL: getURL'));
//   assert.ok(!output.includes('import { visit as goTo'));
// });

// test('skips transformation when no module call is found', () => {
//   const input = `
// import { visit } from '@ember/test-helpers';

// function someFunction() {
//   return visit('/');
// }
// `;

//   const output = transform(input);

//   assert.ok(output.includes('import { visit } from \'@ember/test-helpers\';'));
//   assert.ok(!output.includes('beforeEach'));
// });

// test('skips transformation when module has no hooks parameter', () => {
//   const input = `
// import { visit } from '@ember/test-helpers';
// import { module, test } from 'qunit';

// module('Test without hooks', function () {
//   test('should work', function (assert) {
//     assert.ok(true);
//   });
// });
// `;

//   const output = transform(input);

//   // Should not transform because there's no hooks parameter
//   assert.ok(output.includes('import { visit } from \'@ember/test-helpers\';'));
//   assert.ok(output.includes('import { module, test } from \'qunit\';'));
//   assert.ok(!output.includes('beforeEach'));
// });

// test('handles multiple imports correctly', () => {
//   const input = `
// import { visit, currentURL, click } from '@ember/test-helpers';
// import { setupApplicationTest } from 'ember-qunit';
// import { module, test } from 'qunit';

// module('Acceptance | test', function (hooks) {
//   setupApplicationTest(hooks);

//   test('should work', async function (assert) {
//     await visit('/');
//     await click('button');
//     assert.strictEqual(currentURL(), '/');
//   });
// });
// `;

//   const output = transform(input);

//   assert.ok(output.includes('hooks.beforeEach(async () => {'));
//   // Should have three const declarations for the three imports
//   const constMatches = output.match(/const \{/g);
//   assert.strictEqual(constMatches.length, 3);
//   assert.ok(!output.includes('import { visit, currentURL, click }'));
//   assert.ok(!output.includes('import { setupApplicationTest }'));
//   assert.ok(!output.includes('import { module, test }'));
// });

// test('preserves existing code in module callback', () => {
//   const input = `
// import { visit } from '@ember/test-helpers';
// import { module, test } from 'qunit';

// module('Acceptance | test', function (hooks) {
//   // This comment should be preserved
//   setupApplicationTest(hooks);

//   test('should work', async function (assert) {
//     await visit('/');
//   });
// });
// `;

//   const output = transform(input);

//   assert.ok(output.includes('hooks.beforeEach(async () => {'));
//   assert.ok(output.includes('// This comment should be preserved'));
//   assert.ok(output.includes('setupApplicationTest(hooks);'));
// });
