import assert from "node:assert";
import template from "@babel/template";

/**
 * @param options - an object with optional startsWith: [string] or matches: [RegEx]
 */
export default function qunitLazyImportsPlugin(babel, options) {
  const { types: t } = babel;

  if (options.startsWith) {
    assert(
      Array.isArray(options.startsWith),
      `Expected options.startsWith to be an array of strings, but got: ${options.startsWith}`
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

  let importsToMove = [];

  if (!options.startsWith && !options.matches) {
    return { name: "qunit-lazy-imports:noop", visitor: {} };
  }

  return {
    name: "qunit-lazy-imports",
    visitor: {
      ImportDeclaration(path, state) {
        if (shouldMoveImport(path)) {
          let moveThisImport = {
            source: path.node.source.value,
            names: [],
          };
          for (let specifier of path.node.specifiers) {
            moveThisImport.names.push({
              localName: specifier.local.name,
              importName: specifier.imported?.name ?? "default",
            });
          }
          importsToMove.push(moveThisImport);

          for (let specifier of moveThisImport.names) {
            let declaration = template.ast(`let ${specifier.localName};`);
            path.insertBefore(declaration);
          }

          path.remove();
        }
      },
      CallExpression(path, state) {
        if (importsToMove.length === 0) return;
        let module = path.scope.bindings.module;
        if (!module?.path?.parent) return;
        if (module.path.parent?.type !== "ImportDeclaration") return;

        /**
         * Last argument of module() is the function callback.
         *   it could be an arrow function or a regular function.
         *   if it's a regular function it'll be a block for the  function's "body",
         *      which will then also have a "body" which is just an array of expressions.
         *      This last body is where it makes most sense to insert our beforeAll
         */
        let body = path.node.arguments[1].body.body;

        let importsForBeforeAll = importsToMove
          .map((specifier) => {
            return `
          (async () => {
            let module = await import('${specifier.source}');
            ${specifier.names
              .map(
                (namePair) =>
                  `${namePair.localName} = module.${namePair.importName};`
              )
              .join("\n")}
          })()`
    }).join(',\n');
          

        let newCode = template.ast(`
          hooks.beforeAll(async () => {
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
