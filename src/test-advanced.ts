import { generateCSV } from './index';

async function testAdvancedFeatures() {
  console.log('Testing Advanced Features...\n');

  // Test 1: Alphanumeric with length and uppercase
  console.log('Test 1: Alphanumeric type with custom length and uppercase...');
  await generateCSV({
    columns: [
      { header: 'product_code', type: 'alphanumeric', length: 10, uppercase: true },
      { header: 'sku', type: 'alphanumeric', length: 15 },
      { header: 'name', type: 'name' },
    ],
    rows: 5,
    output: 'test-alphanumeric.csv',
  });

  // Test 2: Pick type for enum values
  console.log('\nTest 2: Pick type for predefined values...');
  await generateCSV({
    columns: [
      { header: 'product', type: 'name' },
      { header: 'tax_rate', type: 'pick', values: [0, 7, 19] },
      { header: 'status', type: 'pick', values: ['active', 'pending', 'inactive'] },
      { header: 'unit', type: 'pick', values: ['g', 'kg', 'Stück', 'Meter'] },
    ],
    rows: 5,
    output: 'test-pick.csv',
  });

  // Test 3: Formula fields (calculated values)
  console.log('\nTest 3: Formula type for calculated fields...');
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
    rows: 5,
    output: 'test-formula.csv',
  });

  // Test 4: Custom delimiter (semicolon)
  console.log('\nTest 4: Custom delimiter (semicolon)...');
  await generateCSV({
    columns: [
      { header: 'id', type: 'uuid' },
      { header: 'name', type: 'name' },
      { header: 'email', type: 'email' },
    ],
    rows: 5,
    delimiter: ';',
    output: 'test-semicolon.csv',
  });

  // Test 5: Number with decimal precision
  console.log('\nTest 5: Number type with decimal precision...');
  await generateCSV({
    columns: [
      { header: 'price', type: 'number', min: 10, max: 200, decimals: 2 },
      { header: 'weight', type: 'number', min: 0.1, max: 99.9, decimals: 1 },
      { header: 'quantity', type: 'number', min: 1, max: 1000, decimals: 0 },
    ],
    rows: 5,
    output: 'test-decimals.csv',
  });

  // Test 6: Complete E-commerce Article Example
  console.log('\nTest 6: Complete e-commerce article example (the dogfooding use case)...');
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
    rows: 10,
    output: 'test-articles-complete.csv',
  });

  console.log('\n✓ All advanced feature tests completed successfully!');
  console.log('\nGenerated files:');
  console.log('  - test-alphanumeric.csv (alphanumeric with length/uppercase)');
  console.log('  - test-pick.csv (pick from predefined values)');
  console.log('  - test-formula.csv (calculated fields)');
  console.log('  - test-semicolon.csv (custom delimiter)');
  console.log('  - test-decimals.csv (decimal precision)');
  console.log('  - test-articles-complete.csv (complete e-commerce example)');
}

testAdvancedFeatures().catch((error) => {
  console.error('Error running advanced tests:', error);
  process.exit(1);
});
