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
