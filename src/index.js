import assert from "node:assert";
import * as _template from "@babel/template";

let template;

/**
 * Babel is published weird
 *
 * They try to publish cjs with some esm compat, but they are ultimately cjs.
 * We try to find their "exports.default" -- whichever has the 'ast' function on it.
 */
(() => {
  function setIfProper(maybeTemplate) {
    if (template) return;
    if (!maybeTemplate) return;

    if ("ast" in maybeTemplate) {
      template = maybeTemplate;
    }
  }

  setIfProper(_template);
  setIfProper(_template.default);
  setIfProper(_template.default?.default);
})();

/**
 * @param options - an object with optional startsWith: [string] or matches: [RegEx]
 */
export default function qunitLazyImportsPlugin(babel, options) {
  if (options.startsWith) {
    assert(
      Array.isArray(options.startsWith),
      `Expected options.startsWith to be an array of strings, but got: ${options.startsWith}`,
    );
  }

  function shouldMoveImport(path) {
    let value = path.node.source.value;

    if (options.startsWith) {
      if (
        options.startsWith.some((startsWith) => value.startsWith(startsWith))
      ) {
        return true;
      }
    }

    if (options.matches) {
      if (options.matches.some((match) => match.test(value))) {
        return true;
      }
    }

    return false;
  }

  if (!options.startsWith && !options.matches) {
    return { name: "qunit-lazy-imports:noop", visitor: {} };
  }

  return {
    name: "qunit-lazy-imports",
    visitor: {
      ImportDeclaration(path, state) {
        if (path.node.source.value === "qunit") {
          state.isUsingQunit = true;
        }

        if (shouldMoveImport(path)) {
          let moveThisImport = {
            source: path.node.source.value,
            names: [],
            path,
          };
          for (let specifier of path.node.specifiers) {
            moveThisImport.names.push({
              localName: specifier.local.name,
              importName: specifier.imported?.name ?? "default",
            });
          }
          state.importsToMove ||= [];
          state.importsToMove.push(moveThisImport);
        }
      },
      /**
       * if we have made changes
       */
      Program: {
        exit(path, state) {
          if (!state.isUsingQunit) return;
          if (!state.importsToMove) return;
          if (!state.didMove) return;
          if (state.importsToMove.length === 0) return;

          for (let moveThisImport of state.importsToMove) {
            for (let specifier of moveThisImport.names) {
              let declaration = template.ast(`let ${specifier.localName};`);
              moveThisImport.path.insertBefore(declaration);
            }

            moveThisImport.path.remove();
          }
        },
      },
      /**
       * This main content here likely won't ever run unless in tests
       */
      CallExpression(path, state) {
        if (!state.isUsingQunit) return;
        if (!state.importsToMove) return;
        if (state.importsToMove.length === 0) return;
        let module = path.scope.bindings.module;
        if (!module?.path?.parent) return;
        if (module.path.parent?.type !== "ImportDeclaration") return;
        if (module.path.parent.source.value !== "qunit") return;

        // This is either true, or the rest of this visitor will error accidentally
        state.didMove = true;

        /**
         * Last argument of module() is the function callback.
         *   it could be an arrow function or a regular function.
         *   if it's a regular function it'll be a block for the  function's "body",
         *      which will then also have a "body" which is just an array of expressions.
         *      This last body is where it makes most sense to insert our beforeAll
         */
        let body = path.node.arguments[1].body.body;

        let importsForBeforeAll = state.importsToMove
          .map((specifier) => {
            return `
          (async () => {
            let module = await import('${specifier.source}');
            ${specifier.names
                .map(
                  (namePair) =>
                    `${namePair.localName} = module.${namePair.importName};`,
                )
                .join("\n")}
          })()`;
          })
          .join(",\n");

        let newCode = template.ast(`
          hooks.before(async () => {
            await Promise.all([
                ${importsForBeforeAll}
            ]);
          });
        `);
        body.unshift(newCode);
      },
    },
  };
}
