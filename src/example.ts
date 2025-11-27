import { generateCSV } from './index';

async function runExamples() {
  console.log('Running CSV Faker Generator examples...\n');

  console.log('Example 1: Generating user data...');
  await generateCSV({
    columns: [
      { header: 'id', type: 'uuid' },
      { header: 'name', type: 'name' },
      { header: 'email', type: 'email' },
      { header: 'address', type: 'address' },
      { header: 'phone', type: 'phone' },
    ],
    rows: 10,
    output: 'example-users.csv',
  });

  console.log('\nExample 2: Generating employee data with age range...');
  await generateCSV({
    columns: [
      { header: 'employeeId', type: 'uuid' },
      { header: 'firstName', type: 'firstName' },
      { header: 'lastName', type: 'lastName' },
      { header: 'email', type: 'email' },
      { header: 'age', type: 'number', min: 22, max: 65 },
      { header: 'jobTitle', type: 'jobTitle' },
      { header: 'company', type: 'company' },
      { header: 'salary', type: 'number', min: 40000, max: 150000 },
    ],
    rows: 15,
    output: 'example-employees.csv',
  });

  console.log('\nExample 3: Generating company data...');
  await generateCSV({
    columns: [
      { header: 'companyId', type: 'uuid' },
      { header: 'companyName', type: 'company' },
      { header: 'city', type: 'city' },
      { header: 'country', type: 'country' },
      { header: 'website', type: 'url' },
      { header: 'verified', type: 'boolean' },
    ],
    rows: 8,
    output: 'example-companies.csv',
  });

  console.log('\n✓ All examples completed successfully!');
  console.log('\nGenerated files:');
  console.log('  - example-users.csv (10 rows)');
  console.log('  - example-employees.csv (15 rows)');
  console.log('  - example-companies.csv (8 rows)');
}

runExamples().catch((error) => {
  console.error('Error running examples:', error);
  process.exit(1);
});
