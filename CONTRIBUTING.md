# Contributing

Thanks for your interest in improving csv-faker-generator! Bug reports, feature ideas, and pull requests are all welcome.

## Getting started

Requires Node.js 20.19+ (the minimum supported by `@faker-js/faker` v10).

```bash
git clone https://github.com/manojkken/csv-faker-generator.git
cd csv-faker-generator
npm install
npm test        # builds with tsc, then runs the node:test suite
```

Try the CLI against your local build:

```bash
node dist/cli.js -c id:uuid,name:name,email:email -r 5 -o out.csv
```

## Project layout

| Path | What it is |
| --- | --- |
| `src/index.ts` | Library: data types, `generateCSV`, `parseColumnString` |
| `src/cli.ts` | `csv-faker` command-line interface |
| `test/index.test.js` | Test suite (runs against the compiled `dist/`) |

## Making a change

1. Look for an issue labelled [`good first issue`](https://github.com/manojkken/csv-faker-generator/labels/good%20first%20issue), or open one describing what you'd like to change.
2. Create a branch from `main`.
3. Add or update tests in `test/index.test.js` for any behaviour change.
4. Run `npm test` and make sure it passes.
5. Add a line under `## [Unreleased]` in `CHANGELOG.md`.
6. Open a pull request. CI runs the tests on Node 20, 22, and 24.

### Adding a new data type

1. Add the name to `DATA_TYPES` in `src/index.ts`. The `DataType` type, CLI validation and `--help` list all derive from it.
2. Add a `case` in `generateValue`.
3. Document it in the README and add a test.

## Reporting bugs

Please include the command or code you ran, what you expected, what happened, and your Node.js version.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
