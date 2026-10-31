#!/usr/bin/env node

import { generateCSV, parseColumnString, ColumnDefinition } from './index';
import * as path from 'node:path';

const args = process.argv.slice(2);
const optionNames = new Set([
  '--columns', '-c', '--rows', '-r', '--output', '-o', '--format', '-f',
  '--delimiter', '-d', '--seed', '-s', '--no-header', '--help', '-h',
]);

// Exit quietly when the reader closes the pipe early (e.g. `-o - | head`).
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});

function showHelp() {
  console.log(`
CSV Faker Generator

Usage:
  csv-faker [options]

Options:
  --columns, -c    Column definitions (format: header:type,header:type,...)
                    For pick values, use header:pick:value1|value2 (quote the argument)
                    For date ranges, use header:date:from|to (ISO dates, quote the argument)
                    For alphanumeric, use header:alphanumeric[:length][:upper]
  --rows, -r       Number of rows to generate (default: 10)
  --output, -o     Output file path (default: output.csv). Use - for stdout
  --format, -f     Output format: csv, json, or ndjson (default: inferred from output extension)
  --delimiter, -d  Field delimiter (default: ,) [options: , ; | \\t]
  --seed, -s       PRNG seed for reproducible output
  --no-header      Omit the header row (CSV output only; ignored for json/ndjson)
  --help, -h       Show this help message

Data Types:
  uuid, name, firstName, lastName, title, email, phone, address,
  secondaryAddress, city, country, zipCode, company, jobTitle,
  number, date, boolean, url, ip, username, password, iban, bic,
  bankName, alphanumeric, pick

  Note: dateFormat and formula require programmatic usage. See README for examples.

Examples:
  csv-faker -c id:uuid,name:name,email:email -r 100 -o users.csv
  csv-faker -c userId:uuid,firstName:firstName,lastName:lastName,email:email,address:address -r 50
  csv-faker --columns "id:uuid,company:company,city:city" --rows 20 --output companies.csv
  csv-faker -c id:uuid,name:name,email:email --delimiter ";" -r 50 -o contacts.csv
  csv-faker -c 'id:uuid,status:pick:active|inactive|pending' -r 10
  csv-faker -c 'id:uuid,created:date:2024-01-01|2024-12-31' -r 10
  csv-faker -c 'sku:alphanumeric:12,code:alphanumeric:8:upper' -r 10
  csv-faker -c id:uuid,name:name -r 50 -o users.json
  csv-faker -c id:uuid,name:name -r 50 -f ndjson -o users.data
  csv-faker -c id:uuid,name:name -r 50 --seed 42 -o reproducible.csv
  csv-faker -c id:uuid,email:email -r 5 -o - | head
  csv-faker -c id:uuid -r 3 -f ndjson -o - | jq .
  csv-faker -c id:uuid,email:email -r 100 --no-header -o - >> existing.csv
`);
}

function readOptionValue(option: string, value: string | undefined, allowDashValue = false): string {
  if (value === undefined || optionNames.has(value)) {
    throw new Error(`${option} requires a value`);
  }
  if (value.startsWith('--') || (!allowDashValue && /^-[A-Za-z]$/.test(value))) {
    throw new Error(`Unknown option: ${value}. Run with --help to see available options.`);
  }
  return value;
}

function parseArgs(): { columns: ColumnDefinition[]; rows: number; output: string; format?: 'csv' | 'json' | 'ndjson'; delimiter?: string; seed?: number; header?: boolean } {
  let columnsStr = '';
  let rows = 10;
  let output = 'output.csv';
  let format: 'csv' | 'json' | 'ndjson' | undefined;
  let delimiter = ',';
  let seed: number | undefined;
  let header: boolean | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--columns' || arg === '-c') {
      columnsStr = readOptionValue('--columns', args[++i]);
    } else if (arg === '--rows' || arg === '-r') {
      rows = Number(readOptionValue('--rows', args[++i], true));
      if (!Number.isInteger(rows) || rows < 1) {
        console.error('Error: rows must be a positive integer');
        process.exit(1);
      }
    } else if (arg === '--output' || arg === '-o') {
      output = readOptionValue('--output', args[++i], true);
    } else if (arg === '--format' || arg === '-f') {
      const value = readOptionValue('--format', args[++i]);
      if (value !== 'csv' && value !== 'json' && value !== 'ndjson') {
        throw new Error(`Invalid format: ${value}. Expected csv, json, or ndjson`);
      }
      format = value;
    } else if (arg === '--delimiter' || arg === '-d') {
      delimiter = readOptionValue('--delimiter', args[++i], true);
      // Handle common escape sequences
      if (delimiter === '\\t') {
        delimiter = '\t';
      }
    } else if (arg === '--seed' || arg === '-s') {
      const value = readOptionValue('--seed', args[++i], true);
      const parsedSeed = Number(value);
      if (!value?.trim() || !Number.isInteger(parsedSeed)) {
        console.error('Error: seed must be an integer');
        process.exit(1);
      }
      seed = parsedSeed;
    } else if (arg === '--no-header') {
      header = false;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}. Run with --help to see available options.`);
    }
  }

  if (!columnsStr) {
    console.error('Error: --columns is required\n');
    showHelp();
    process.exit(1);
  }

  const columns = columnsStr.split(',').map(parseColumnString);

  if (!format) {
    const extension = path.extname(output).slice(1).toLowerCase();
    if (extension === 'json' || extension === 'ndjson') {
      format = extension;
    }
  }

  return { columns, rows, output, format, delimiter, seed, header };
}

async function main() {
  try {
    const options = parseArgs();
    await generateCSV(options);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
