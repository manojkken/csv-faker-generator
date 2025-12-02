# CSV Faker Generator

Generate CSV files with realistic fake data using customizable headers and data types. Perfect for testing, prototyping, and development.

## Features

- **27+ data types**: UUID, names, emails, addresses, banking info, and more
- **Advanced data generation**: Alphanumeric strings, pick from custom values, formula-based calculated fields
- **Flexible number formatting**: Control decimal precision and ranges
- **Custom delimiters**: Support for comma, semicolon, tab, pipe
- **Simple CLI interface**: Generate CSV files from command line
- **Programmatic API**: Use in Node.js/TypeScript projects
- **Full TypeScript support**: Complete type definitions included

## Installation

```bash
npm install csv-faker-generator
```

## Quick Start

### CLI Usage

```bash
# Basic usage
npx csv-faker -c id:uuid,name:name,email:email -r 100 -o users.csv

# With custom delimiter
npx csv-faker -c id:uuid,name:name,email:email --delimiter ";" -r 50 -o contacts.csv
```

### Programmatic Usage

```typescript
import { generateCSV } from 'csv-faker-generator';

await generateCSV({
  columns: [
    { header: 'id', type: 'uuid' },
    { header: 'name', type: 'name' },
    { header: 'email', type: 'email' },
  ],
  rows: 100,
  output: 'users.csv',
});
```

## Advanced Features

### 1. Alphanumeric Type

Generate alphanumeric strings with custom length and case:

```typescript
await generateCSV({
  columns: [
    { header: 'product_code', type: 'alphanumeric', length: 10, uppercase: true },
    { header: 'sku', type: 'alphanumeric', length: 15 },
  ],
  rows: 100,
  output: 'products.csv',
});
```

Output:
```csv
product_code,sku
PMA094QITG,nbdAIBY9Og7gDWd
SXYBL4LJQO,gakXOrBZYw1tYFP
```

### 2. Pick Type (Enum Values)

Select values from predefined arrays:

```typescript
await generateCSV({
  columns: [
    { header: 'product', type: 'name' },
    { header: 'tax_rate', type: 'pick', values: [0, 7, 19] },
    { header: 'status', type: 'pick', values: ['active', 'pending', 'inactive'] },
    { header: 'unit', type: 'pick', values: ['g', 'kg', 'Stück', 'Meter'] },
  ],
  rows: 100,
  output: 'products.csv',
});
```

### 3. Formula Type (Calculated Fields)

Create calculated fields based on other columns:

```typescript
await generateCSV({
  columns: [
    { header: 'product', type: 'company' },
    { header: 'netto', type: 'number', min: 10, max: 200, decimals: 2 },
    { header: 'tax', type: 'pick', values: [0, 7, 19] },
    {
      header: 'brutto',
      type: 'formula',
      formula: (row) => {
        const netto = row.netto;
        const tax = row.tax;
        return parseFloat((netto * (1 + tax / 100)).toFixed(2));
      },
    },
  ],
  rows: 100,
  output: 'invoices.csv',
});
```

Output:
```csv
product,netto,tax,brutto
Reichert LLC,120.39,19,143.26
Becker LLC,132.14,7,141.39
```

### 4. Decimal Precision

Control decimal places for number types:

```typescript
await generateCSV({
  columns: [
    { header: 'price', type: 'number', min: 10, max: 200, decimals: 2 },
    { header: 'weight', type: 'number', min: 0.1, max: 99.9, decimals: 1 },
    { header: 'quantity', type: 'number', min: 1, max: 1000, decimals: 0 }, // integers
  ],
  rows: 100,
  output: 'products.csv',
});
```

### 5. Custom Delimiters

Generate CSV files with different delimiters:

```typescript
// Semicolon-separated
await generateCSV({
  columns: [{ header: 'id', type: 'uuid' }, { header: 'name', type: 'name' }],
  rows: 100,
  delimiter: ';',
  output: 'contacts.csv',
});

// Tab-separated (TSV)
await generateCSV({
  columns: [{ header: 'id', type: 'uuid' }, { header: 'name', type: 'name' }],
  rows: 100,
  delimiter: '\t',
  output: 'data.tsv',
});
```

## Complete Example: E-commerce Articles

This example demonstrates all advanced features together:

```typescript
import { generateCSV } from 'csv-faker-generator';

await generateCSV({
  columns: [
    { header: 'Artikelnummer*', type: 'alphanumeric', length: 15 },
    { header: 'Bezeichnung*', type: 'company' },
    { header: 'Beschreibung', type: 'company' },
    { header: 'Verkaufspreis netto in €', type: 'number', min: 10, max: 200, decimals: 2 },
    { header: 'Steuersatz', type: 'pick', values: [0, 7, 19] },
    {
      header: 'Verkaufspreis brutto in €',
      type: 'formula',
      formula: (row) => {
        const netto = row['Verkaufspreis netto in €'];
        const tax = row['Steuersatz'];
        return parseFloat((netto * (1 + tax / 100)).toFixed(2));
      },
    },
    { header: 'Einkaufspreis netto in €', type: 'number', min: 5, max: 100, decimals: 2 },
    { header: 'Einheit', type: 'pick', values: ['Stück', 'kg', 'g', 'Meter', 'Liter'] },
    { header: 'Bestand', type: 'number', min: 0, max: 1000, decimals: 0 },
    { header: 'Kategorie', type: 'pick', values: ['Electronics', 'Food', 'Clothing', 'Books'] },
  ],
  rows: 100,
  output: 'articles.csv',
});
```

## CLI Reference

### Options

- `--columns, -c` - Column definitions (format: `header:type,header:type,...`)
- `--rows, -r` - Number of rows to generate (default: 10)
- `--output, -o` - Output file path (default: output.csv)
- `--delimiter, -d` - Field delimiter (default: `,`) [options: `,` `;` `|` `\t`]
- `--help, -h` - Show help message

### Examples

```bash
# Generate users
npx csv-faker -c id:uuid,name:name,email:email -r 100 -o users.csv

# Generate with semicolon delimiter
npx csv-faker -c id:uuid,name:name,email:email --delimiter ";" -r 50 -o contacts.csv

# Generate customer data
npx csv-faker -c customer_number:number,title:title,firstname:firstName,lastname:lastName,email:email,iban:iban,bic:bic -r 200 -o customers.csv
```

**Note**: Advanced features like `alphanumeric` with length, `pick` with values, and `formula` require programmatic usage. CLI only supports basic data types.

## Supported Data Types

| Type | Description | Example | CLI | Programmatic |
|------|-------------|---------|-----|--------------|
| `uuid` | UUID v4 | `550e8400-e29b-...` | ✓ | ✓ |
| `name` | Full name | `John Doe` | ✓ | ✓ |
| `firstName` | First name | `John` | ✓ | ✓ |
| `lastName` | Last name | `Doe` | ✓ | ✓ |
| `title` | Person prefix | `Mr.`, `Mrs.`, `Dr.` | ✓ | ✓ |
| `email` | Email address | `john.doe@example.com` | ✓ | ✓ |
| `phone` | Phone number | `+1-234-567-8900` | ✓ | ✓ |
| `address` | Street address | `123 Main St` | ✓ | ✓ |
| `secondaryAddress` | Apt/Suite | `Apt. 4B` | ✓ | ✓ |
| `city` | City name | `New York` | ✓ | ✓ |
| `country` | Country name | `United States` | ✓ | ✓ |
| `zipCode` | Postal code | `10001` | ✓ | ✓ |
| `company` | Company name | `Tech Corp` | ✓ | ✓ |
| `jobTitle` | Job title | `Software Engineer` | ✓ | ✓ |
| `number` | Random number | `42` | ✓ | ✓ |
| `date` | ISO date | `2024-01-15T10:30:00.000Z` | ✓ | ✓ |
| `boolean` | Boolean | `true` / `false` | ✓ | ✓ |
| `url` | Website URL | `https://example.com` | ✓ | ✓ |
| `ip` | IP address | `192.168.1.1` | ✓ | ✓ |
| `username` | Username | `john_doe123` | ✓ | ✓ |
| `password` | Password | `aB3$xYz9!qW` | ✓ | ✓ |
| `iban` | IBAN | `DE89370400440532013000` | ✓ | ✓ |
| `bic` | BIC/SWIFT | `COBADEFFXXX` | ✓ | ✓ |
| `bankName` | Bank name | `Deutsche Bank` | ✓ | ✓ |
| `alphanumeric` | Alphanumeric string | `aB3xYz9qW` | ✓* | ✓ |
| `pick` | Pick from array | Custom values | ✓* | ✓ |
| `formula` | Calculated value | Based on other fields | ✗ | ✓ |

*CLI supports the type but not advanced options (length, uppercase, values, etc.)

## TypeScript API

### Types

```typescript
type DataType =
  | 'uuid' | 'name' | 'firstName' | 'lastName' | 'title'
  | 'email' | 'phone' | 'address' | 'secondaryAddress'
  | 'city' | 'country' | 'zipCode' | 'company' | 'jobTitle'
  | 'number' | 'date' | 'boolean' | 'url' | 'ip'
  | 'username' | 'password' | 'iban' | 'bic' | 'bankName'
  | 'alphanumeric' | 'pick' | 'formula';

interface ColumnDefinition {
  header: string;
  type: DataType;
  min?: number;              // For 'number' type
  max?: number;              // For 'number' type
  length?: number;           // For 'alphanumeric' type
  uppercase?: boolean;       // For 'alphanumeric' type
  values?: any[];            // For 'pick' type
  formula?: (row: Record<string, any>) => any; // For 'formula' type
  decimals?: number;         // For 'number' type
}

interface GenerateOptions {
  columns: ColumnDefinition[];
  rows: number;
  output: string;
  delimiter?: string;        // Default: ','
}

function generateCSV(options: GenerateOptions): Promise<void>;
```

## More Examples

### Example 1: User Database

```typescript
await generateCSV({
  columns: [
    { header: 'userId', type: 'uuid' },
    { header: 'username', type: 'username' },
    { header: 'email', type: 'email' },
    { header: 'password', type: 'password' },
    { header: 'createdAt', type: 'date' },
  ],
  rows: 1000,
  output: 'users.csv',
});
```

### Example 2: Banking Data

```typescript
await generateCSV({
  columns: [
    { header: 'accountId', type: 'uuid' },
    { header: 'accountOwner', type: 'name' },
    { header: 'iban', type: 'iban' },
    { header: 'bic', type: 'bic' },
    { header: 'bankName', type: 'bankName' },
    { header: 'balance', type: 'number', min: 0, max: 100000, decimals: 2 },
  ],
  rows: 500,
  output: 'accounts.csv',
});
```

### Example 3: Inventory System

```typescript
await generateCSV({
  columns: [
    { header: 'SKU', type: 'alphanumeric', length: 12, uppercase: true },
    { header: 'Product', type: 'company' },
    { header: 'Category', type: 'pick', values: ['Electronics', 'Furniture', 'Clothing', 'Food'] },
    { header: 'Price', type: 'number', min: 5, max: 500, decimals: 2 },
    { header: 'Stock', type: 'number', min: 0, max: 1000, decimals: 0 },
    { header: 'Status', type: 'pick', values: ['In Stock', 'Low Stock', 'Out of Stock'] },
  ],
  rows: 200,
  output: 'inventory.csv',
});
```

## Future Features (Roadmap)

Based on community feedback, we're considering:

- Locale support for region-specific data
- Templates/presets for common use cases
- Row dependencies and conditional values
- Related dataset generation (parent-child relationships)
- More business data types (VAT numbers, tax IDs, etc.)

See [issues](https://github.com/yourusername/csv-faker-generator/issues) for discussions and requests.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues & Support

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/yourusername/csv-faker-generator/issues).
