# CSV Faker Generator

Generate CSV files with realistic fake data using customizable headers and data types. Perfect for testing, prototyping, and development.

## Features

- Generate CSV files with custom column headers
- Support for 19+ data types (UUID, names, emails, addresses, etc.)
- Simple CLI interface
- Programmatic API for Node.js projects
- TypeScript support with full type definitions

## Installation

```bash
npm install csv-faker-generator
```

## Usage

### CLI Usage

Generate a CSV file from the command line:

```bash
# Basic usage
npx csv-faker -c id:uuid,name:name,email:email -r 100 -o users.csv

# Generate user data
npx csv-faker --columns "userId:uuid,firstName:firstName,lastName:lastName,email:email,phone:phone" --rows 50 --output customers.csv

# Generate company data
npx csv-faker -c id:uuid,company:company,city:city,country:country -r 20
```

#### CLI Options

- `--columns, -c` - Column definitions (format: `header:type,header:type,...`)
- `--rows, -r` - Number of rows to generate (default: 10)
- `--output, -o` - Output file path (default: output.csv)
- `--help, -h` - Show help message

### Programmatic Usage

Use in your Node.js/TypeScript projects:

```typescript
import { generateCSV } from 'csv-faker-generator';

await generateCSV({
  columns: [
    { header: 'id', type: 'uuid' },
    { header: 'name', type: 'name' },
    { header: 'email', type: 'email' },
    { header: 'address', type: 'address' },
  ],
  rows: 100,
  output: 'users.csv',
});
```

#### With Custom Number Ranges

```typescript
await generateCSV({
  columns: [
    { header: 'id', type: 'uuid' },
    { header: 'age', type: 'number', min: 18, max: 65 },
    { header: 'salary', type: 'number', min: 30000, max: 150000 },
  ],
  rows: 50,
  output: 'employees.csv',
});
```

## Supported Data Types

| Type | Description | Example |
|------|-------------|---------|
| `uuid` | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |
| `name` | Full name | `John Doe` |
| `firstName` | First name only | `John` |
| `lastName` | Last name only | `Doe` |
| `email` | Email address | `john.doe@example.com` |
| `phone` | Phone number | `+1-234-567-8900` |
| `address` | Street address | `123 Main St` |
| `city` | City name | `New York` |
| `country` | Country name | `United States` |
| `zipCode` | Postal code | `10001` |
| `company` | Company name | `Tech Corp` |
| `jobTitle` | Job title | `Software Engineer` |
| `number` | Random number | `42` |
| `date` | ISO date string | `2024-01-15T10:30:00.000Z` |
| `boolean` | Boolean value | `true` or `false` |
| `url` | Website URL | `https://example.com` |
| `ip` | IP address | `192.168.1.1` |
| `username` | Username | `john_doe123` |
| `password` | Password | `aB3$xYz9!qW` |

## Examples

### Example 1: User Database

```bash
npx csv-faker -c userId:uuid,username:username,email:email,password:password,createdAt:date -r 1000 -o users.csv
```

### Example 2: E-commerce Orders

```typescript
import { generateCSV } from 'csv-faker-generator';

await generateCSV({
  columns: [
    { header: 'orderId', type: 'uuid' },
    { header: 'customerName', type: 'name' },
    { header: 'email', type: 'email' },
    { header: 'amount', type: 'number', min: 10, max: 500 },
    { header: 'orderDate', type: 'date' },
    { header: 'city', type: 'city' },
    { header: 'country', type: 'country' },
  ],
  rows: 500,
  output: 'orders.csv',
});
```

### Example 3: Employee Directory

```bash
npx csv-faker -c id:uuid,firstName:firstName,lastName:lastName,email:email,phone:phone,jobTitle:jobTitle,company:company -r 200 -o employees.csv
```

## API Reference

### `generateCSV(options: GenerateOptions): Promise<void>`

Generates a CSV file with fake data.

**Parameters:**
- `options.columns`: Array of column definitions
- `options.rows`: Number of rows to generate
- `options.output`: Output file path

**ColumnDefinition:**
```typescript
interface ColumnDefinition {
  header: string;
  type: DataType;
  min?: number;  // For 'number' type
  max?: number;  // For 'number' type
}
```

### `parseColumnString(columnStr: string): ColumnDefinition`

Parses a column string (e.g., "id:uuid") into a ColumnDefinition object.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/yourusername/csv-faker-generator/issues).
