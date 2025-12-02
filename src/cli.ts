#!/usr/bin/env node

import { generateCSV, parseColumnString, ColumnDefinition } from './index';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
CSV Faker Generator

Usage:
  csv-faker [options]

Options:
  --columns, -c    Column definitions (format: header:type,header:type,...)
  --rows, -r       Number of rows to generate (default: 10)
  --output, -o     Output file path (default: output.csv)
  --delimiter, -d  Field delimiter (default: ,) [options: , ; | \\t]
  --help, -h       Show this help message

Data Types:
  uuid, name, firstName, lastName, title, email, phone, address,
  secondaryAddress, city, country, zipCode, company, jobTitle,
  number, date, boolean, url, ip, username, password, iban, bic,
  bankName, alphanumeric, pick

  Note: Advanced features (alphanumeric length, pick values, formula)
  require programmatic usage. See README for examples.

Examples:
  csv-faker -c id:uuid,name:name,email:email -r 100 -o users.csv
  csv-faker -c userId:uuid,firstName:firstName,lastName:lastName,email:email,address:address -r 50
  csv-faker --columns "id:uuid,company:company,city:city" --rows 20 --output companies.csv
  csv-faker -c id:uuid,name:name,email:email --delimiter ";" -r 50 -o contacts.csv
`);
}

function parseArgs(): { columns: ColumnDefinition[]; rows: number; output: string; delimiter?: string } {
  let columnsStr = '';
  let rows = 10;
  let output = 'output.csv';
  let delimiter = ',';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--columns' || arg === '-c') {
      columnsStr = args[++i];
    } else if (arg === '--rows' || arg === '-r') {
      rows = parseInt(args[++i], 10);
      if (isNaN(rows) || rows < 1) {
        console.error('Error: rows must be a positive number');
        process.exit(1);
      }
    } else if (arg === '--output' || arg === '-o') {
      output = args[++i];
    } else if (arg === '--delimiter' || arg === '-d') {
      delimiter = args[++i];
      // Handle common escape sequences
      if (delimiter === '\\t') {
        delimiter = '\t';
      }
    }
  }

  if (!columnsStr) {
    console.error('Error: --columns is required\n');
    showHelp();
    process.exit(1);
  }

  const columns = columnsStr.split(',').map(parseColumnString);

  return { columns, rows, output, delimiter };
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
