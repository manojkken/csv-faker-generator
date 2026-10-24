const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { generateCSV, parseColumnString } = require('../dist/index');

// generateCSV logs a status line per call; keep it out of the test reporter stream.
mock.method(console, 'log', () => {});

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csv-faker-'));

async function generate(columns, opts = {}) {
  const output = path.join(tmpDir, `${Math.random().toString(36).slice(2)}.csv`);
  await generateCSV({ columns, rows: opts.rows ?? 20, output, delimiter: opts.delimiter });
  const [header, ...rows] = fs.readFileSync(output, 'utf8').trim().split('\n');
  const sep = opts.delimiter ?? ',';
  return { header: header.split(sep), rows: rows.map((r) => r.split(sep)) };
}

test('writes header and requested number of rows', async () => {
  const { header, rows } = await generate(
    [{ header: 'id', type: 'uuid' }, { header: 'email', type: 'email' }],
    { rows: 15 },
  );
  assert.deepEqual(header, ['id', 'email']);
  assert.equal(rows.length, 15);
  for (const [id, email] of rows) {
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.match(email, /@/);
  }
});

test('respects custom delimiter', async () => {
  const { header, rows } = await generate(
    [{ header: 'a', type: 'uuid' }, { header: 'b', type: 'uuid' }],
    { delimiter: ';' },
  );
  assert.deepEqual(header, ['a', 'b']);
  for (const row of rows) assert.equal(row.length, 2);
});

test('number stays within min/max and honours decimals', async () => {
  const { rows } = await generate([
    { header: 'int', type: 'number', min: 10, max: 20 },
    { header: 'price', type: 'number', min: 1, max: 5, decimals: 2 },
  ]);
  for (const [int, price] of rows) {
    assert.ok(Number.isInteger(Number(int)) && +int >= 10 && +int <= 20, `int out of range: ${int}`);
    assert.ok(+price >= 1 && +price <= 5, `price out of range: ${price}`);
    assert.ok((price.split('.')[1] ?? '').length <= 2, `too many decimals: ${price}`);
  }
});

test('number honours zero as a bound', async () => {
  const { rows } = await generate([
    { header: 'zero', type: 'number', min: 0, max: 0 },
    { header: 'neg', type: 'number', min: -5, max: 0, decimals: 1 },
  ]);
  for (const [zero, neg] of rows) {
    assert.equal(+zero, 0);
    assert.ok(+neg >= -5 && +neg <= 0, `neg out of range: ${neg}`);
  }
});

test('alphanumeric respects length and uppercase', async () => {
  const { rows } = await generate([{ header: 'code', type: 'alphanumeric', length: 8, uppercase: true }]);
  for (const [code] of rows) assert.match(code, /^[A-Z0-9]{8}$/);
});

test('pick only returns supplied values', async () => {
  const values = ['active', 'inactive', 'pending'];
  const { rows } = await generate([{ header: 'status', type: 'pick', values }]);
  for (const [status] of rows) assert.ok(values.includes(status), `unexpected value: ${status}`);
});

test('date stays within from/to range', async () => {
  const from = '2024-01-01T00:00:00.000Z';
  const to = '2024-12-31T23:59:59.999Z';
  const { rows } = await generate([{ header: 'created', type: 'date', from, to }], { rows: 50 });
  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  for (const [created] of rows) {
    const ms = Date.parse(created);
    assert.ok(!Number.isNaN(ms), `invalid date: ${created}`);
    assert.ok(ms >= fromMs && ms <= toMs, `date out of range: ${created}`);
  }
});

test('dateFormat date outputs YYYY-MM-DD within range', async () => {
  const from = '2023-06-01';
  const to = '2023-06-30';
  const { rows } = await generate(
    [{ header: 'birthday', type: 'date', from, to, dateFormat: 'date' }],
    { rows: 50 },
  );
  for (const [birthday] of rows) {
    assert.match(birthday, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(birthday >= from && birthday <= to, `date out of range: ${birthday}`);
  }
});

test('date with only one bound throws', async () => {
  await assert.rejects(
    generate([{ header: 'created', type: 'date', from: '2024-01-01' }]),
    /requires both from and to/,
  );
  await assert.rejects(
    generate([{ header: 'created', type: 'date', to: '2024-12-31' }]),
    /requires both from and to/,
  );
});

test('pick without values throws', async () => {
  await assert.rejects(generate([{ header: 'x', type: 'pick' }]), /requires values/);
});

test('formula can reference columns declared after it', async () => {
  const { header, rows } = await generate([
    { header: 'total', type: 'formula', formula: (r) => r.qty * r.price },
    { header: 'qty', type: 'number', min: 1, max: 10 },
    { header: 'price', type: 'number', min: 1, max: 10 },
  ]);
  assert.deepEqual(header, ['total', 'qty', 'price']);
  for (const [total, qty, price] of rows) assert.equal(+total, qty * price);
});

test('JSON format writes an array of row objects and defaults to CSV', async () => {
  const jsonOutput = path.join(tmpDir, 'rows.json');
  await generateCSV({
    columns: [{ header: 'enabled', type: 'pick', values: [true] }, { header: 'count', type: 'pick', values: [3] }],
    rows: 2,
    output: jsonOutput,
    format: 'json',
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(jsonOutput, 'utf8')), [
    { enabled: true, count: 3 },
    { enabled: true, count: 3 },
  ]);

  const csvOutput = path.join(tmpDir, 'default.csv');
  await generateCSV({ columns: [{ header: 'value', type: 'pick', values: ['ok'] }], rows: 1, output: csvOutput });
  assert.equal(fs.readFileSync(csvOutput, 'utf8'), 'value\nok\n');
});

test('NDJSON format writes one row object per line', async () => {
  const output = path.join(tmpDir, 'rows.ndjson');
  await generateCSV({
    columns: [{ header: 'value', type: 'pick', values: ['ok'] }],
    rows: 2,
    output,
    format: 'ndjson',
  });
  const lines = fs.readFileSync(output, 'utf8').trim().split('\n');
  assert.deepEqual(lines.map((line) => JSON.parse(line)), [{ value: 'ok' }, { value: 'ok' }]);
});

test('generateCSV rejects invalid formats without creating files', async () => {
  const output = path.join(tmpDir, 'invalid-format.csv');
  for (const format of ['xml', '', 'CSV', null, 0]) {
    await assert.rejects(generateCSV({
      columns: [{ header: 'value', type: 'pick', values: ['ok'] }],
      rows: 1,
      output,
      format,
    }), { message: `Invalid format: ${format}. Expected csv, json, or ndjson` });
    assert.equal(fs.existsSync(output), false);
  }
});

test('invalid format preserves existing output and does not generate or reseed data', async () => {
  const { faker } = require('@faker-js/faker');
  const output = path.join(tmpDir, 'preserved-format.csv');
  fs.writeFileSync(output, 'existing content\n');
  let formulaCalls = 0;
  faker.seed(123);
  const expectedNextId = faker.string.uuid();
  faker.seed(123);

  await assert.rejects(generateCSV({
    columns: [
      { header: 'id', type: 'uuid' },
      { header: 'value', type: 'formula', formula: () => ++formulaCalls },
    ],
    rows: 1,
    output,
    format: 'xml',
    seed: 456,
  }), { message: 'Invalid format: xml. Expected csv, json, or ndjson' });

  assert.equal(fs.readFileSync(output, 'utf8'), 'existing content\n');
  assert.equal(formulaCalls, 0);
  assert.equal(faker.string.uuid(), expectedNextId);
});

test('parseColumnString parses header:type', () => {
  assert.deepEqual(parseColumnString('id:uuid'), { header: 'id', type: 'uuid' });
});

test('parseColumnString parses pick values including colons', () => {
  assert.deepEqual(parseColumnString('status:pick:active|inactive|pending'), {
    header: 'status',
    type: 'pick',
    values: ['active', 'inactive', 'pending'],
  });
  assert.deepEqual(parseColumnString('status:pick: active | inactive '), {
    header: 'status',
    type: 'pick',
    values: ['active', 'inactive'],
  });
  assert.deepEqual(parseColumnString('url:pick:http://a|http://b'), {
    header: 'url',
    type: 'pick',
    values: ['http://a', 'http://b'],
  });
});

test('parseColumnString parses date ranges', () => {
  assert.deepEqual(parseColumnString('created:date:2024-01-01|2024-12-31'), {
    header: 'created',
    type: 'date',
    from: '2024-01-01',
    to: '2024-12-31',
  });
  assert.deepEqual(parseColumnString('created:date: 2024-01-01 | 2024-12-31 '), {
    header: 'created',
    type: 'date',
    from: '2024-01-01',
    to: '2024-12-31',
  });
});

test('parseColumnString parses alphanumeric length and upper', () => {
  assert.deepEqual(parseColumnString('sku:alphanumeric'), { header: 'sku', type: 'alphanumeric' });
  assert.deepEqual(parseColumnString('sku:alphanumeric:12'), {
    header: 'sku',
    type: 'alphanumeric',
    length: 12,
  });
  assert.deepEqual(parseColumnString('code:alphanumeric:8:upper'), {
    header: 'code',
    type: 'alphanumeric',
    length: 8,
    uppercase: true,
  });
  assert.deepEqual(parseColumnString('code:alphanumeric:upper'), {
    header: 'code',
    type: 'alphanumeric',
    uppercase: true,
  });
});

test('parseColumnString rejects bad input', () => {
  assert.throws(() => parseColumnString('id'), /Invalid column format/);
  assert.throws(() => parseColumnString('id:nope'), /Invalid data type/);
  assert.throws(() => parseColumnString('status:pick'), /pick type.*requires values/);
  assert.throws(() => parseColumnString('status:pick: | '), /pick type.*requires values/);
  assert.throws(() => parseColumnString('created:date:2024-01-01'), /date type.*requires from\|to/);
  assert.throws(() => parseColumnString('created:date: | '), /date type.*requires from\|to/);
  assert.throws(() => parseColumnString('sku:alphanumeric:0'), /alphanumeric.*positive integer/);
  assert.throws(() => parseColumnString('sku:alphanumeric:-3'), /alphanumeric.*positive integer/);
  assert.throws(() => parseColumnString('sku:alphanumeric:abc'), /alphanumeric.*positive integer/);
  assert.throws(() => parseColumnString('sku:alphanumeric:8:lower'), /alphanumeric.*upper/);
});

test('CLI generates a file', () => {
  const { execFileSync } = require('node:child_process');
  const output = path.join(tmpDir, 'cli.csv');
  execFileSync(process.execPath, [
    path.join(__dirname, '..', 'dist', 'cli.js'), '-c', 'id:uuid,name:name', '-r', '5', '-o', output,
  ]);
  const lines = fs.readFileSync(output, 'utf8').trim().split('\n');
  assert.equal(lines[0], 'id,name');
  assert.equal(lines.length, 6);
});

test('CLI writes to stdout when -o is -', () => {
  const { execFileSync } = require('node:child_process');
  const cli = path.join(__dirname, '..', 'dist', 'cli.js');

  const csvOut = execFileSync(process.execPath, [
    cli, '-c', 'value:pick:ok', '-r', '2', '-o', '-',
  ], { encoding: 'utf8' });
  assert.equal(csvOut, 'value\nok\nok\n');
  assert.ok(!csvOut.includes('Generated'));

  const jsonOut = execFileSync(process.execPath, [
    cli, '-c', 'value:pick:ok', '-r', '2', '-f', 'json', '-o', '-',
  ], { encoding: 'utf8' });
  assert.deepEqual(JSON.parse(jsonOut), [{ value: 'ok' }, { value: 'ok' }]);

  const ndjsonOut = execFileSync(process.execPath, [
    cli, '-c', 'value:pick:ok', '-r', '2', '-f', 'ndjson', '-o', '-',
  ], { encoding: 'utf8' });
  assert.deepEqual(ndjsonOut.trim().split('\n').map((line) => JSON.parse(line)), [
    { value: 'ok' },
    { value: 'ok' },
  ]);
});

for (const option of ['--rows', '-r', '--seed', '-s']) {
  test(`CLI rejects invalid ${option} values without creating files`, async (t) => {
    const { spawnSync } = require('node:child_process');
    const cli = path.join(__dirname, '..', 'dist', 'cli.js');
    const isRows = option === '--rows' || option === '-r';
    const invalidValues = [isRows ? '10abc' : '42abc', '1.5', 'NaN', 'Infinity', '', '   ', undefined, '--output'];
    if (isRows) invalidValues.push('0', '-1');

    for (const value of invalidValues) {
      await t.test(value === undefined ? 'missing value' : JSON.stringify(value), () => {
        const output = path.join(tmpDir, `invalid-${option}-${invalidValues.indexOf(value)}.csv`);
        const args = [cli, '-c', 'id:uuid', '-o', output, option];
        if (value !== undefined) args.push(value);
        const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
        assert.equal(result.status, 1, result.stderr);
        assert.match(result.stderr, isRows ? /rows must be a positive integer/ : /seed must be an integer/);
        assert.equal(result.stdout, '');
        assert.equal(fs.existsSync(output), false);
      });
    }
  });
}

test('invalid CLI numbers preserve existing output', () => {
  const { spawnSync } = require('node:child_process');
  const cli = path.join(__dirname, '..', 'dist', 'cli.js');
  const output = path.join(tmpDir, 'preserved-number.csv');
  fs.writeFileSync(output, 'existing content\n');

  for (const [option, value] of [['--rows', '10abc'], ['--seed', '42abc']]) {
    const result = spawnSync(process.execPath, [cli, '-c', 'id:uuid', '-o', output, option, value]);
    assert.equal(result.status, 1);
    assert.equal(fs.readFileSync(output, 'utf8'), 'existing content\n');
  }
});

test('CLI accepts integer numeric values including zero and negative seeds', () => {
  const { execFileSync } = require('node:child_process');
  const cli = path.join(__dirname, '..', 'dist', 'cli.js');
  const longOutput = path.join(tmpDir, 'valid-long.json');
  const shortOutput = path.join(tmpDir, 'valid-short.json');

  for (const seed of ['0', '-42', '42']) {
    execFileSync(process.execPath, [cli, '-c', 'id:uuid', '--rows', '2.0', '--seed', seed, '-o', longOutput]);
    execFileSync(process.execPath, [cli, '-c', 'id:uuid', '-r', '2e0', '-s', seed, '-o', shortOutput]);
    assert.equal(JSON.parse(fs.readFileSync(longOutput, 'utf8')).length, 2);
    assert.equal(fs.readFileSync(longOutput, 'utf8'), fs.readFileSync(shortOutput, 'utf8'));
  }
});

test('CLI accepts --format and infers JSON formats from the output extension', () => {
  const { execFileSync } = require('node:child_process');
  const cli = path.join(__dirname, '..', 'dist', 'cli.js');
  const jsonOutput = path.join(tmpDir, 'cli-explicit.json');
  execFileSync(process.execPath, [cli, '-c', 'id:uuid', '-r', '2', '-f', 'json', '-o', jsonOutput]);
  assert.equal(JSON.parse(fs.readFileSync(jsonOutput, 'utf8')).length, 2);

  const ndjsonOutput = path.join(tmpDir, 'cli-inferred.ndjson');
  execFileSync(process.execPath, [cli, '-c', 'id:uuid', '-r', '2', '-o', ndjsonOutput]);
  assert.equal(fs.readFileSync(ndjsonOutput, 'utf8').trim().split('\n').length, 2);
});

test('CLI accepts pick values', () => {
  const { execFileSync } = require('node:child_process');
  const output = path.join(tmpDir, 'cli-pick.csv');
  execFileSync(process.execPath, [
    path.join(__dirname, '..', 'dist', 'cli.js'),
    '-c', 'status:pick:active|inactive|pending', '-r', '10', '-o', output,
  ]);
  const [header, ...values] = fs.readFileSync(output, 'utf8').trim().split('\n');
  assert.equal(header, 'status');
  assert.equal(values.length, 10);
  for (const value of values) {
    assert.ok(['active', 'inactive', 'pending'].includes(value));
  }
});

test('CLI accepts date ranges', () => {
  const { execFileSync } = require('node:child_process');
  const output = path.join(tmpDir, 'cli-date.csv');
  execFileSync(process.execPath, [
    path.join(__dirname, '..', 'dist', 'cli.js'),
    '-c', 'created:date:2024-01-01|2024-12-31', '-r', '20', '-o', output,
  ]);
  const [header, ...values] = fs.readFileSync(output, 'utf8').trim().split('\n');
  assert.equal(header, 'created');
  assert.equal(values.length, 20);
  const fromMs = Date.parse('2024-01-01');
  const toMs = Date.parse('2024-12-31');
  for (const value of values) {
    const ms = Date.parse(value);
    assert.ok(!Number.isNaN(ms), `invalid date: ${value}`);
    assert.ok(ms >= fromMs && ms <= toMs, `date out of range: ${value}`);
  }
});

test('CLI accepts alphanumeric length and upper', () => {
  const { execFileSync } = require('node:child_process');
  const output = path.join(tmpDir, 'cli-alphanumeric.csv');
  execFileSync(process.execPath, [
    path.join(__dirname, '..', 'dist', 'cli.js'),
    '-c', 'sku:alphanumeric:12,code:alphanumeric:8:upper', '-r', '10', '-o', output,
  ]);
  const [header, ...rows] = fs.readFileSync(output, 'utf8').trim().split('\n');
  assert.equal(header, 'sku,code');
  assert.equal(rows.length, 10);
  for (const row of rows) {
    const [sku, code] = row.split(',');
    assert.match(sku, /^[A-Za-z0-9]{12}$/);
    assert.match(code, /^[A-Z0-9]{8}$/);
  }
});
test('generateCSV produces reproducible output when given the same seed', async () => {
  const file1 = path.join(tmpDir, 'seeded-1.csv');
  const file2 = path.join(tmpDir, 'seeded-2.csv');
  const file3 = path.join(tmpDir, 'seeded-3.csv');

  const columns = [
    { header: 'id', type: 'uuid' },
    { header: 'name', type: 'name' },
    { header: 'email', type: 'email' },
    { header: 'age', type: 'number', min: 18, max: 99 },
  ];

  await generateCSV({ columns, rows: 10, output: file1, seed: 12345 });
  await generateCSV({ columns, rows: 10, output: file2, seed: 12345 });
  await generateCSV({ columns, rows: 10, output: file3, seed: 54321 });

  const content1 = fs.readFileSync(file1, 'utf8');
  const content2 = fs.readFileSync(file2, 'utf8');
  const content3 = fs.readFileSync(file3, 'utf8');

  assert.equal(content1, content2);
  assert.notEqual(content1, content3);
});

test('CLI accepts --seed and -s for reproducible output', () => {
  const { execFileSync } = require('node:child_process');
  const cli = path.join(__dirname, '..', 'dist', 'cli.js');
  const out1 = path.join(tmpDir, 'cli-seed-1.csv');
  const out2 = path.join(tmpDir, 'cli-seed-2.csv');
  const out3 = path.join(tmpDir, 'cli-seed-3.csv');

  execFileSync(process.execPath, [cli, '-c', 'id:uuid,name:name', '-r', '5', '--seed', '999', '-o', out1]);
  execFileSync(process.execPath, [cli, '-c', 'id:uuid,name:name', '-r', '5', '-s', '999', '-o', out2]);
  execFileSync(process.execPath, [cli, '-c', 'id:uuid,name:name', '-r', '5', '-s', '111', '-o', out3]);

  const content1 = fs.readFileSync(out1, 'utf8');
  const content2 = fs.readFileSync(out2, 'utf8');
  const content3 = fs.readFileSync(out3, 'utf8');

  assert.equal(content1, content2);
  assert.notEqual(content1, content3);
});

test('CLI exits cleanly when stdout is closed early (EPIPE)', async () => {
  const { spawn } = require('node:child_process');
  const cli = path.join(__dirname, '..', 'dist', 'cli.js');
  const child = spawn(process.execPath, [cli, '-c', 'id:uuid', '-r', '200000', '-o', '-'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.stdout.once('data', () => child.stdout.destroy());
  const code = await new Promise((resolve) => child.on('close', resolve));
  assert.doesNotMatch(stderr, /Unhandled 'error'/);
  assert.equal(code, 0, stderr);
});
