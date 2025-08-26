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
  /**
   * Hack / perf opt to avoid naming collisions without needing to figure out what scope is used / available.
   */
  let id = 0;

  if (options.startsWith) {
    assert(
      Array.isArray(options.startsWith),
      `Expected options.startsWith to be an array of strings, but got: ${options.startsWith}`,
    );
  }

  if (options.excludes?.startsWith) {
    assert(
      Array.isArray(options.startsWith),
      `Expected options.excludes.startsWith to be an array of strings, but got: ${options.excludes?.startsWith}`,
    );
  }

  function shouldMoveImport(path) {
    let value = path.node.source.value;

    if (options?.excludes?.startsWith) {
      if (
        options.excludes.startsWith.some((startsWith) =>
          value.startsWith(startsWith),
        )
      ) {
        return false;
      }
    }

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
    console.warn(`Using the noop qunit-lazy-imports plugin. If you meant to configure it, please pass either "startsWith" or "matches" options. Otherwise this plugin can be removed.`);
    return { name: "qunit-lazy-imports:noop", visitor: {} };
  }

  function isAboutToMove(source, state) {
    if (!state.importsToMove) return false;
    if (state.importsToMove.length === 0) return false;

    let found = state.importsToMove.find((importToMove) => {
      return importToMove.source === source;
    });

    return Boolean(found);
  }

  /**
   * We only need to care about references that are outside of the qunit module()'s scope.
   * These will later be moved into the beforeAll() hook.
   */
  function findReferencesToMove(path, state) {
    if (!state.isUsingQunit) return;
    let importSource = path.parent.source.value;
    if (importSource === "qunit") return;
    /**
     * We hit the ImportDeclaration before we hit the specifiers.
     */
    if (!isAboutToMove(importSource, state)) return;

    let bindings = path.scope.bindings;

    let binding;
    switch (path.type) {
      case "ImportDefaultSpecifier": {
        binding = bindings[path.node.local.name];
        break;
      }
      case "ImportNamespaceSpecifier": {
        binding = bindings[path.node.local.name];
        break;
      }
      case "ImportSpecifier": {
        binding = bindings[path.node.local.name];
        break;
      }
    }
    // somehow unused
    if (!binding) return;

    for (let ref of binding.referencePaths) {
      // if referenced within the module() callback, we don't care
      // else, we need to move it into the beforeAll
      let parent = ref.parentPath;

      while (parent) {
        if (parent.node === state.moduleNode) {
          break;
        }

        if (parent.type === "FunctionExpression") {
          break;
        }

        if (parent.type === "ArrowFunctionExpression") {
          break;
        }
        
        if (parent.type === "Program") { 
          switch (ref.type) {
            case "VariableDeclarator": {
              state.refsToMove ||= [];
              state.refsToMove.push(ref);
            }
            default : {
              console.log(ref.type);
            }
          }
          
          break;
        }

        parent = parent.parentPath;
      }
    }

    console.log(binding);
  }

  return {
    name: "qunit-lazy-imports",
    visitor: {
      ImportDeclaration(path, state) {
        if (path.node.source.value === "qunit") {
          state.isUsingQunit = true;

          /**
           * import { module } from 'qunit';
           * (or import { module as qunitModuleWhateverName } from 'qunit';)
           */
          if (!state.moduleNode) {
            state.moduleNode = path.node.specifiers.find((specifier) => {
              return specifier.imported?.name === 'module';
            });

            assert(state.moduleNode, `Use of the qunit-lazy-imports plugin requires that you import { module } from 'qunit';`);
          }
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
      ImportDefaultSpecifier(path, state) {
        findReferencesToMove(path, state);
      },
      ImportNamespaceSpecifier(path, state) {
        findReferencesToMove(path, state);
      },
      ImportSpecifier(path, state) {
        findReferencesToMove(path, state);
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

          for (let ref of state.refsToMove || []) {
            let declaration = template.ast(`let ${ref.node.id.declarations.map(decl => decl.id.name).join(', ')};`);
            ref.insertBefore(declaration);
            ref.remove();
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

        /**
         * If the module is not defined, we aren't defining module() tests
         */
        if (!module?.path?.parent) return;
        /**
         * If module in scope is not from an import, we don't care
         */
        if (module.path.parent?.type !== "ImportDeclaration") return;
        /**
         * If the imported module is not "qunit", we don't care
         */
        if (module.path.parent.source.value !== "qunit") return;
        /**
         * If the CallExpression doesn't match the imported specifier, we don't care about it
         */
        let isCorrectlyReferenced = module.referencePaths.some(
          (refPath) => refPath.node === path.node.callee,
        );

        if (!isCorrectlyReferenced) return;

        // This is either true, or the rest of this visitor will error accidentally
        state.didMove = true;

        let moduleFunction = path.node.arguments[1];

        if (!moduleFunction) {
          throw new Error(
            `This is an invalid test. A module() call must have a second argument which is a function.`,
          );
        }

        let isValid =
          moduleFunction.type === "FunctionExpression" ||
          moduleFunction.type === "ArrowFunctionExpression";

        if (!isValid) {
          throw new Error(
            `Second argument passed to qunit's module() should be a function, but got: ${moduleFunction.type}`,
          );
        }

        let hooksName = moduleFunction.params[0]?.name;

        if (!hooksName) {
          id++;
          hooksName = `lazyAddedHooks${id}`;
          moduleFunction.params.push(babel.types.identifier(hooksName));
        }

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

        let declarationsBeforeAll = state.refsToMove?.map(ref => {
          let str = ref.parentPath;
          return str.getSource();
        })?.join('\n') || '';

        let newCode = template.ast(`
          ${hooksName}.before(async () => {
            await Promise.all([
                ${importsForBeforeAll}
            ]);
            
            ${declarationsBeforeAll}
          });
        `);
        body.unshift(newCode);
      },
    },
  };
}
