import { faker } from '@faker-js/faker';
import { createObjectCsvStringifier, createObjectCsvWriter } from 'csv-writer';
import { writeFile } from 'node:fs/promises';

const COLUMN_DEFINITION_SEPARATOR = ':';
const PICK_VALUES_SEPARATOR = '|';

export type DataType =
  | 'uuid'
  | 'name'
  | 'firstName'
  | 'lastName'
  | 'title'
  | 'email'
  | 'phone'
  | 'address'
  | 'secondaryAddress'
  | 'city'
  | 'country'
  | 'zipCode'
  | 'company'
  | 'jobTitle'
  | 'number'
  | 'date'
  | 'boolean'
  | 'url'
  | 'ip'
  | 'username'
  | 'password'
  | 'iban'
  | 'bic'
  | 'bankName'
  | 'alphanumeric'
  | 'pick'
  | 'formula';

export interface ColumnDefinition {
  header: string;
  type: DataType;
  min?: number;
  max?: number;
  length?: number;
  uppercase?: boolean;
  values?: any[];
  formula?: (row: Record<string, any>) => any;
  decimals?: number;
  from?: string;
  to?: string;
  dateFormat?: 'iso' | 'date';
}

export interface GenerateOptions {
  columns: ColumnDefinition[];
  rows: number;
  output: string;
  format?: 'csv' | 'json' | 'ndjson';
  delimiter?: string;
  seed?: number;
}

function formatDate(value: Date, dateFormat: 'iso' | 'date' = 'iso'): string {
  if (dateFormat === 'date') {
    return value.toISOString().slice(0, 10);
  }
  return value.toISOString();
}

function generateValue(column: ColumnDefinition, row?: Record<string, any>): string | number | boolean {
  const { type, min, max, length, uppercase, values, decimals, from, to, dateFormat } = column;

  switch (type) {
    case 'uuid':
      return faker.string.uuid();
    case 'name':
      return faker.person.fullName();
    case 'firstName':
      return faker.person.firstName();
    case 'lastName':
      return faker.person.lastName();
    case 'title':
      return faker.person.prefix();
    case 'email':
      return faker.internet.email();
    case 'phone':
      return faker.phone.number();
    case 'address':
      return faker.location.streetAddress();
    case 'secondaryAddress':
      return faker.location.secondaryAddress();
    case 'city':
      return faker.location.city();
    case 'country':
      return faker.location.country();
    case 'zipCode':
      return faker.location.zipCode();
    case 'company':
      return faker.company.name();
    case 'jobTitle':
      return faker.person.jobTitle();
    case 'number': {
      const num = faker.number.int({ min: min ?? 1, max: max ?? 1000 });
      if (decimals !== undefined) {
        const float = faker.number.float({ min: min ?? 1, max: max ?? 1000, fractionDigits: decimals });
        return parseFloat(float.toFixed(decimals));
      }
      return num;
    }
    case 'date': {
      if ((from == null) !== (to == null)) {
        throw new Error('date type requires both from and to when a range is specified');
      }
      const value = from != null && to != null
        ? faker.date.between({ from, to })
        : faker.date.recent();
      return formatDate(value, dateFormat);
    }
    case 'boolean':
      return faker.datatype.boolean();
    case 'url':
      return faker.internet.url();
    case 'ip':
      return faker.internet.ip();
    case 'username':
      return faker.internet.username();
    case 'password':
      return faker.internet.password();
    case 'iban':
      return faker.finance.iban();
    case 'bic':
      return faker.finance.bic();
    case 'bankName':
      return faker.company.name() + ' Bank';
    case 'alphanumeric': {
      const len = length || 10;
      let result = faker.string.alphanumeric(len);
      if (uppercase) {
        result = result.toUpperCase();
      }
      return result;
    }
    case 'pick': {
      if (!values || values.length === 0) {
        throw new Error('pick type requires values array');
      }
      return faker.helpers.arrayElement(values);
    }
    case 'formula': {
      if (!column.formula || !row) {
        throw new Error('formula type requires formula function and row context');
      }
      return column.formula(row);
    }
    default:
      return faker.lorem.word();
  }
}

export async function generateCSV(options: GenerateOptions): Promise<void> {
  const { columns, rows, output, format = 'csv', delimiter = ',', seed } = options;

  if (format !== 'csv' && format !== 'json' && format !== 'ndjson') {
    throw new Error(`Invalid format: ${format}. Expected csv, json, or ndjson`);
  }

  const seenHeaders = new Set<string>();
  for (const column of columns) {
    if (seenHeaders.has(column.header)) {
      throw new Error(`Duplicate column header: ${column.header}`);
    }
    seenHeaders.add(column.header);
  }

  if (seed !== undefined) {
    faker.seed(seed);
  }

  const records = [];

  for (let i = 0; i < rows; i++) {
    const record: Record<string, any> = {};

    // First pass: generate non-formula columns
    for (const column of columns) {
      if (column.type !== 'formula') {
        record[column.header] = generateValue(column, record);
      }
    }

    // Second pass: generate formula columns (they can reference other columns)
    for (const column of columns) {
      if (column.type === 'formula') {
        record[column.header] = generateValue(column, record);
      }
    }

    records.push(record);
  }

  const toStdout = output === '-';
  const csvHeader = columns.map((col) => ({
    id: col.header,
    title: col.header,
  }));

  if (format === 'json') {
    const content = `${JSON.stringify(records, null, 2)}\n`;
    if (toStdout) {
      process.stdout.write(content);
    } else {
      await writeFile(output, content);
    }
  } else if (format === 'ndjson') {
    const joined = records.map((record) => JSON.stringify(record)).join('\n');
    const content = joined ? `${joined}\n` : '';
    if (toStdout) {
      process.stdout.write(content);
    } else {
      await writeFile(output, content);
    }
  } else if (toStdout) {
    const csvStringifier = createObjectCsvStringifier({
      header: csvHeader,
      fieldDelimiter: delimiter,
    });
    process.stdout.write(csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records));
  } else {
    const csvWriter = createObjectCsvWriter({
      path: output,
      header: csvHeader,
      fieldDelimiter: delimiter,
    });
    await csvWriter.writeRecords(records);
  }

  const status = `✓ Generated ${rows} rows ${toStdout ? 'to stdout' : `in ${output}`}`;
  if (toStdout) {
    console.error(status);
  } else {
    console.log(status);
  }
}

export function parseColumnString(columnStr: string): ColumnDefinition {
  const parts = columnStr.split(COLUMN_DEFINITION_SEPARATOR);
  if (parts.length < 2) {
    throw new Error(`Invalid column format: ${columnStr}. Expected format: header:type`);
  }

  const [header, typeStr] = parts;

  if (header === '') {
    throw new Error(`Invalid column format: ${columnStr}. Header cannot be empty`);
  }

  const type = typeStr as DataType;

  const validTypes: DataType[] = [
    'uuid', 'name', 'firstName', 'lastName', 'title', 'email', 'phone',
    'address', 'secondaryAddress', 'city', 'country', 'zipCode', 'company', 'jobTitle',
    'number', 'date', 'boolean', 'url', 'ip', 'username', 'password',
    'iban', 'bic', 'bankName', 'alphanumeric', 'pick'
  ];

  if (!validTypes.includes(type)) {
    throw new Error(`Invalid data type: ${type}. Valid types: ${validTypes.join(', ')}`);
  }

  if (type === 'pick') {
    const values = parts.slice(2)
      .join(COLUMN_DEFINITION_SEPARATOR)
      .split(PICK_VALUES_SEPARATOR)
      .map((value) => value.trim())
      .filter(Boolean);
    if (values.length === 0) {
      throw new Error(`pick type for column "${header}" requires values after the second colon, separated by |`);
    }
    return { header, type, values };
  }

  if (type === 'date' && parts.length > 2) {
    const bounds = parts.slice(2)
      .join(COLUMN_DEFINITION_SEPARATOR)
      .split(PICK_VALUES_SEPARATOR)
      .map((value) => value.trim())
      .filter(Boolean);
    if (bounds.length !== 2) {
      throw new Error(`date type for column "${header}" requires from|to ISO dates after the second colon`);
    }
    return { header, type, from: bounds[0], to: bounds[1] };
  }

  if (type === 'alphanumeric') {
    const result: ColumnDefinition = { header, type };
    let index = 2;

    if (parts.length > index) {
      const token = parts[index];
      if (token === 'upper') {
        result.uppercase = true;
        index += 1;
      } else {
        const length = Number(token);
        if (!Number.isInteger(length) || length < 1) {
          throw new Error(
            `alphanumeric length for column "${header}" must be a positive integer`,
          );
        }
        result.length = length;
        index += 1;

        if (parts.length > index) {
          if (parts[index] !== 'upper') {
            throw new Error(
              `alphanumeric option for column "${header}" must be "upper"`,
            );
          }
          result.uppercase = true;
          index += 1;
        }
      }
    }

    if (parts.length > index) {
      throw new Error(
        `alphanumeric option for column "${header}" must be "upper"`,
      );
    }

    return result;
  }

  return { header, type };
}

export { DataType as DataTypes };
