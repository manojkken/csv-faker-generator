import { faker } from '@faker-js/faker';
import { createObjectCsvStringifier } from 'csv-writer';
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
  header?: boolean;
}

function formatDate(value: Date, dateFormat: 'iso' | 'date' = 'iso'): string {
  if (dateFormat === 'date') {
    return value.toISOString().slice(0, 10);
  }
  return value.toISOString();
}

/**
 * The whole steps of 10^-decimals inside [min, max], as integers. Rounding the
 * scaled bounds first absorbs float error, so 0.29 at 2 places is step 29,
 * not 28.999999999999996.
 */
function decimalSteps(min: number, max: number, decimals: number): { low: number; high: number } {
  const scale = 10 ** decimals;
  return {
    low: Math.ceil(Number((min * scale).toFixed(6))),
    high: Math.floor(Number((max * scale).toFixed(6))),
  };
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
      // Decide the path before drawing: an integer draw on a range such as
      // 10.25..10.75 has no integer in it and would throw.
      if (decimals !== undefined && decimals > 0) {
        const lo = min ?? 1;
        const hi = max ?? 1000;
        const { low, high } = decimalSteps(lo, hi, decimals);
        if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high)) {
          // Past 2^53 the steps are no longer exact integers, so draw a plain
          // float and clamp the rounded value back into range.
          const rounded = parseFloat(faker.number.float({ min: lo, max: hi }).toFixed(decimals));
          return Math.min(hi, Math.max(lo, rounded));
        }
        return parseFloat((faker.number.int({ min: low, max: high }) / 10 ** decimals).toFixed(decimals));
      }
      return faker.number.int({ min: min ?? 1, max: max ?? 1000 });
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
  const { columns, rows, output, format = 'csv', delimiter = ',', seed, header = true } = options;

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
  } else {
    const csvStringifier = createObjectCsvStringifier({
      header: csvHeader,
      fieldDelimiter: delimiter,
    });
    const headerString = header ? csvStringifier.getHeaderString() ?? '' : '';
    const content = headerString + csvStringifier.stringifyRecords(records);
    if (toStdout) {
      process.stdout.write(content);
    } else {
      await writeFile(output, content);
    }
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

  if (type === 'number' && parts.length > 2) {
    const bounds = parts[2]
      .split(PICK_VALUES_SEPARATOR)
      .map((value) => value.trim());
    if (bounds.length !== 2 || bounds[0] === '' || bounds[1] === '') {
      throw new Error(`number type for column "${header}" requires min|max after the second colon`);
    }

    const min = Number(bounds[0]);
    const max = Number(bounds[1]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error(`number bounds for column "${header}" must be finite numbers`);
    }
    if (min > max) {
      throw new Error(`number min for column "${header}" must not be greater than max`);
    }

    const result: ColumnDefinition = { header, type, min, max };

    if (parts.length > 3) {
      const decimalsToken = parts[3].trim();
      const decimals = Number(decimalsToken);
      if (decimalsToken === '' || !Number.isInteger(decimals) || decimals < 0 || decimals > 100) {
        throw new Error(`number decimals for column "${header}" must be an integer from 0 to 100`);
      }
      result.decimals = decimals;
    }

    if (parts.length > 4) {
      throw new Error(`number type for column "${header}" has too many parts after the second colon`);
    }

    const steps = decimalSteps(min, max, result.decimals ?? 0);
    if (!Number.isSafeInteger(steps.low) || !Number.isSafeInteger(steps.high)) {
      throw new Error(
        result.decimals
          ? `number range for column "${header}" is too large for ${result.decimals} decimal place(s); use fewer decimals or a smaller range`
          : `number range for column "${header}" is too large; keep bounds within ±${Number.MAX_SAFE_INTEGER}`,
      );
    }
    if (steps.low > steps.high) {
      throw new Error(
        result.decimals
          ? `number range for column "${header}" contains no value with ${result.decimals} decimal place(s); use more decimals`
          : `number range for column "${header}" contains no integer; use decimals of 1 or more (for example ${header}:number:${bounds[0]}|${bounds[1]}:2)`,
      );
    }

    return result;
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
