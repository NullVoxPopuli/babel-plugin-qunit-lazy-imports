# babel-plugin-qunit-lazy-imports

A babel plugin to transform all imports in your qunit tests to be lazy so in your vite (or similar) projects, your tests only import what modules you're qunit modules are about to run.

## Setup

In your babel config:

```js
module.exports = {
    plugins: [
        ['module:babel-plugin-qunit-lazy-imports' , {
            // Both options are optional, but one must be present
            startsWith: ['module-to-be-async/'],
            matches: [/some-regex/]
        }]
    ]
}

```

## Install

```bash
npm add babel-plugin-qunit-lazy-imports
```

## Contributing

contributions welcome!
(I get GitHub emails)
