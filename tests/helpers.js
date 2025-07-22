import { transformSync } from "@babel/core";
import qunitLazyImportsPlugin from "../src/index.js";

export function transform(code, config) {
  const result = transformSync(code, {
    plugins: [[qunitLazyImportsPlugin, config]],
    parserOpts: {
      sourceType: "module",
    },
  });
  return result.code;
}

export function transformTS(code, config) {
  const result = transformSync(code, {
    plugins: [
          [
      '@babel/plugin-transform-typescript',
      {
        allExtensions: true,
        onlyRemoveTypeImports: true,
        allowDeclareFields: true,
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: require.resolve('decorator-transforms/runtime-esm'),
        },
      },
    ],
      [qunitLazyImportsPlugin, config]
    ],
    parserOpts: {
      sourceType: "module",
    },
  });
  return result.code;
}
