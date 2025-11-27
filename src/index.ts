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
  | 'bankName';

export interface ColumnDefinition {
  header: string;
  type: DataType;
  min?: number;
  max?: number;
}

export interface GenerateOptions {
  columns: ColumnDefinition[];
  rows: number;
  output: string;
}

function generateValue(type: DataType, min?: number, max?: number): string | number | boolean {
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
    case 'number':
      return faker.number.int({ min: min || 1, max: max || 1000 });
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
    default:
      return faker.lorem.word();
  }
}

export async function generateCSV(options: GenerateOptions): Promise<void> {
  const { columns, rows, output } = options;

  const csvWriter = createObjectCsvWriter({
    path: output,
    header: columns.map((col) => ({
      id: col.header,
      title: col.header,
    })),
  });

  const records = [];
  for (let i = 0; i < rows; i++) {
    const record: Record<string, any> = {};
    for (const column of columns) {
      record[column.header] = generateValue(column.type, column.min, column.max);
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
    'iban', 'bic', 'bankName'
  ];

  if (!validTypes.includes(type)) {
    throw new Error(`Invalid data type: ${type}. Valid types: ${validTypes.join(', ')}`);
  }

  return { header, type };
}

export { DataType as DataTypes };
