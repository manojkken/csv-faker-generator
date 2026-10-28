# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Reject unknown CLI options and report when an option value is missing.

## [2.3.0] - 2026-10-25

### Added
- Optional `from` / `to` ISO date bounds and `dateFormat` (`iso` | `date`) for the `date` type; CLI accepts `header:date:from|to`. Thanks [@dbdefault](https://github.com/dbdefault)! (#23)
- CLI support for `alphanumeric` `length` and `uppercase` via `header:alphanumeric[:length][:upper]` syntax. Thanks [@dbdefault](https://github.com/dbdefault)! (#22)
- CLI `-o -` writes generated data to stdout (CSV via stringifier; JSON/NDJSON via `process.stdout`). Status line goes to stderr (`… to stdout`) so pipes stay clean, and closing the pipe early (e.g. `| head`) exits cleanly instead of crashing with EPIPE. Thanks [@dbdefault](https://github.com/dbdefault)! (#21)

### Fixed
- Reject invalid or fractional CLI `--rows` / `--seed` values and unknown programmatic output formats. Thanks [@KingEmma7](https://github.com/KingEmma7)! (#20)

## [2.2.0] - 2026-10-21

### Added
- `--seed` / `-s` CLI flag and `seed` option in `GenerateOptions` for reproducible output. Thanks [@slopggobblercobbler81](https://github.com/slopggobblercobbler81)! (#13)
- CLI support for `pick` values using `header:pick:value1|value2` syntax. Thanks [@shubhambaghel34](https://github.com/shubhambaghel34)! (#14)

## [2.1.0] - 2026-10-20

### Added
- JSON and NDJSON output formats for the programmatic API (`format` option) and CLI (`--format` / `-f`), inferred from `.json` / `.ndjson` output extensions when not specified. Thanks [@shubhambaghel34](https://github.com/shubhambaghel34)! (#10)

## [2.0.1] - 2026-10-20

### Fixed
- `number` type now honours `0` as `min` or `max` (previously an explicit `0` fell back to the default). (#4)

### Added
- MIT `LICENSE` file. (#1)
- Test suite (`node:test`) and GitHub Actions CI on Node 20, 22, and 24. (#2)
- `CONTRIBUTING.md` guide. (#5)

### Changed
- Published package no longer includes the `example` and `test-advanced` demo scripts.

## [2.0.0] - 2025-12-02

### Added
- `alphanumeric` type with `length` and `uppercase` options.
- `pick` type that selects from a custom `values` array.
- `formula` type for calculated columns that can reference any other column in the row.
- `decimals` option for the `number` type.
- Custom field delimiter (`delimiter` option, `--delimiter` / `-d` CLI flag), including `\t` for tab.

### Changed
- CLI help now lists every supported data type (`title`, `secondaryAddress`, `iban`, `bic`, `bankName`, `alphanumeric`, `pick`).

## [1.0.0] - 2025-11-27

### Added
- Initial release: CLI (`csv-faker`) and programmatic `generateCSV` API with Faker-backed data types.

[Unreleased]: https://github.com/manojkken/csv-faker-generator/compare/v2.3.0...HEAD
[2.3.0]: https://github.com/manojkken/csv-faker-generator/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/manojkken/csv-faker-generator/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/manojkken/csv-faker-generator/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/manojkken/csv-faker-generator/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/manojkken/csv-faker-generator/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/manojkken/csv-faker-generator/releases/tag/v1.0.0
