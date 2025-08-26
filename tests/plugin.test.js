import { it, expect } from "vitest";

import { transform, transformTS } from "./helpers.js";

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
      hooks.before(async () => {
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
      hooks.before(async () => {
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

it("moves multiple imports correctly", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing, { otherFancyThing } from 'fancy-app/some/path';
      import { otherFancyThing2 } from 'fancy-app/some/other/path';
      import aThing from 'fancy-app/some/other/path';

      module('Acceptance | test', function (hooks) {
        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing, someFancyThing2, aThing)
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
    let otherFancyThing2;
    let aThing;
    module('Acceptance | test', function (hooks) {
      hooks.before(async () => {
        await Promise.all([(async () => {
          let module = await import('fancy-app/some/path');
          someFancyThing = module.default;
          otherFancyThing = module.otherFancyThing;
        })(), (async () => {
          let module = await import('fancy-app/some/other/path');
          otherFancyThing2 = module.otherFancyThing2;
        })(), (async () => {
          let module = await import('fancy-app/some/other/path');
          aThing = module.default;
        })()]);
      });
      test('should work', async function (assert) {
        await visit('/');
        assert.strictEqual(currentURL(), '/');
        console.log(someFancyThing, someFancyThing2, aThing);
      });
    });"
  `);
});

it("moves aliased imports", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import { default as foo, someFancyThing as bar } from 'fancy-app/some/path';

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
    let foo;
    let bar;
    module('Acceptance | test', function (hooks) {
      hooks.before(async () => {
        await Promise.all([(async () => {
          let module = await import('fancy-app/some/path');
          foo = module.default;
          bar = module.someFancyThing;
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

it("moves multiple different imports correctly", () => {
  expect(
    transform(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing, { otherFancyThing } from 'fancy-app/some/path';
      import { otherFancyThing2 } from 'fancy-app/some/other/path';
      import aThing from 'big-library/some/other/path';

      module('Acceptance | test', function (hooks) {
        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing, someFancyThing2, aThing)
        });
      });
`,
      {
        startsWith: ["fancy-app/", "big-library"],
      },
    ),
  ).toMatchInlineSnapshot(`
    "import { visit, currentURL } from '@ember/test-helpers';
    import { module, test } from 'qunit';
    let someFancyThing;
    let otherFancyThing;
    let otherFancyThing2;
    let aThing;
    module('Acceptance | test', function (hooks) {
      hooks.before(async () => {
        await Promise.all([(async () => {
          let module = await import('fancy-app/some/path');
          someFancyThing = module.default;
          otherFancyThing = module.otherFancyThing;
        })(), (async () => {
          let module = await import('fancy-app/some/other/path');
          otherFancyThing2 = module.otherFancyThing2;
        })(), (async () => {
          let module = await import('big-library/some/other/path');
          aThing = module.default;
        })()]);
      });
      test('should work', async function (assert) {
        await visit('/');
        assert.strictEqual(currentURL(), '/');
        console.log(someFancyThing, someFancyThing2, aThing);
      });
    });"
  `);
});

it("doesn't get confused with other top-level CallExpressions", () => {
  expect(
    transform(
      `import { module, test } from 'qunit';

import { currentURL, visit } from '@ember/test-helpers';

import { idForWorkspace } from 'my-app/utils/workspace';

const THE_ID = idForWorkspace('foo');

module('name a', function (hooks) {
	setupApplicationTest(hooks);

	hooks.beforeEach(async function () {
		console.log(THE_ID);
	});
});
`,
      { startsWith: ["my-app"] },
    ),
  ).toMatchInlineSnapshot(`
  "import { module, test } from 'qunit';
  import { currentURL, visit } from '@ember/test-helpers';
  let idForWorkspace;
  const THE_ID = idForWorkspace('foo');
  module('name a', function (hooks) {
    hooks.before(async () => {
      await Promise.all([(async () => {
        let module = await import('my-app/utils/workspace');
        idForWorkspace = module.idForWorkspace;
      })()]);
    });
    setupApplicationTest(hooks);
    hooks.beforeEach(async function () {
      console.log(THE_ID);
    });
  });"
`);
});

it("does not move type imports", () => {
  expect(
    transformTS(
      `
      import { visit, currentURL } from '@ember/test-helpers';
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';
      import type { Foo } from 'fancy-app/types';

      module('Acceptance | test', function (hooks) {
        test('should work', async function (assert) {
          await visit('/');
          assert.strictEqual(currentURL(), '/');
          console.log(someFancyThing as Foo)
        });
      });
`,
      {
        startsWith: ["fancy-app"],
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


it("references imports in module space are then also move", () => {
  expect(
    transformTS(
      `
      import { module, test } from 'qunit';
      import someFancyThing from 'fancy-app/some/path';
      import type { Foo } from 'fancy-app/types';

      const oi = someFancyThing();

      function doit(foo: Foo) {
        return 0;      
      }

      module('Acceptance | test', function (hooks) {
        test('should work', async function (assert) {
          assert.strictEqual(doit(0), 0);
          assert.strictEqual(oi, 0);
          console.log(someFancyThing as Foo)
        });
      });
`,
      {
        startsWith: ["fancy-app"],
      },
    ),
  ).toMatchInlineSnapshot(`
    "import { module, test } from 'qunit';
    let someFancyThing;
    function doit(foo) {
      return 0;
    }
    module('Acceptance | test', function (hooks) {
      hooks.before(async () => {
        await Promise.all([(async () => {
          let module = await import('fancy-app/some/path');
          someFancyThing = module.default;
          oi = someFancyThing();
        })()]);
      });
      test('should work', async function (assert) {
        assert.strictEqual(doit(0), 0);
        assert.strictEqual(oi, 0);
        console.log(someFancyThing);
      });
    });"
  `);
});
