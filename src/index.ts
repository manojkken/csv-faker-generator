import { faker } from '@faker-js/faker';
import { createObjectCsvWriter } from 'csv-writer';
import * as path from 'path';

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
}

export interface GenerateOptions {
  columns: ColumnDefinition[];
  rows: number;
  output: string;
  delimiter?: string;
}

function generateValue(column: ColumnDefinition, row?: Record<string, any>): string | number | boolean {
  const { type, min, max, length, uppercase, values, decimals } = column;

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
      const num = faker.number.int({ min: min || 1, max: max || 1000 });
      if (decimals !== undefined) {
        const float = faker.number.float({ min: min || 1, max: max || 1000, fractionDigits: decimals });
        return parseFloat(float.toFixed(decimals));
      }
      return num;
    }
    case 'date':
      return faker.date.recent().toISOString();
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
  const { columns, rows, output, delimiter = ',' } = options;

  const csvWriter = createObjectCsvWriter({
    path: output,
    header: columns.map((col) => ({
      id: col.header,
      title: col.header,
    })),
    fieldDelimiter: delimiter,
  });

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

  await csvWriter.writeRecords(records);
  console.log(`✓ Generated ${rows} rows in ${output}`);
}

export function parseColumnString(columnStr: string): ColumnDefinition {
  const parts = columnStr.split(':');
  if (parts.length < 2) {
    throw new Error(`Invalid column format: ${columnStr}. Expected format: header:type`);
  }

  const [header, typeStr] = parts;
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

  return { header, type };
}

export { DataType as DataTypes };
