import { it, expect } from "vitest";

import { transform } from "./helpers.js";

it('extra suite name', () => {
  expect(() => transform(`
import { module, test } from 'qunit';

import { setupTest } from 'my-app/tests/helpers/setup-tests';

module('Unit | Model | User', 'Unit | Model | user', function (hooks) {
	setupTest(hooks);
});

`, { startsWith: ['my-app'] })).toThrowError(`Second argument passed to qunit's module\(\) should be a function, but got: StringLiteral`);

});