#!/usr/bin/env node
//
// Fails the build when the Unit 7 field report stops being true of the
// programs it describes.
//
// The report's whole conceit is that the company is invented and the
// engineering is not: every number in Appendix A is a real constant, every
// name in section 7 is a real test, and Listing 1 is real source. Nothing in
// this repository can notice when the other repository moves, so this reads
// the Lua directly and compares it against src/data/unit-7.js -- the same
// module the page renders from, so there is no third copy to keep in step.
//
//   node tools/check-source-drift.mjs [path-to-computercraft-scripts]
//
// Defaults to ../computercraft-scripts, which is where a sibling clone lands.

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { specs, suites, stopCondition } from '../src/data/unit-7.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(
  process.argv[2] ?? process.env.SCRIPTS_DIR ?? join(HERE, '..', '..', 'computercraft-scripts'),
);

const failures = [];
const checks = [];

const fail = (what, detail) => failures.push({ what, detail });
const pass = (what, detail) => checks.push({ what, detail });

// ---------------------------------------------------------------- reading

if (!existsSync(root)) {
  console.error(`Cannot find the scripts repository at ${root}`);
  console.error('Pass its path as an argument or set SCRIPTS_DIR.');
  process.exit(2);
}

const read = (rel) => {
  const p = join(root, rel);
  if (!existsSync(p)) {
    console.error(`Missing ${rel} in ${root}`);
    process.exit(2);
  }
  return readFileSync(p, 'utf8');
};

const lua = {
  'turtles/flattener.lua': read('turtles/flattener.lua'),
  'turtles/sweeper.lua': read('turtles/sweeper.lua'),
  'lib/updater.lua': read('lib/updater.lua'),
};
const luaTests = {
  'test/flattener_test.lua': read('test/flattener_test.lua'),
  'test/sweeper_test.lua': read('test/sweeper_test.lua'),
  'test/updater_test.lua': read('test/updater_test.lua'),
};

// ---------------------------------------------------------------- parsing

/**
 * `local NAME = <literal>` at the head of a program, or `module.NAME =
 * <literal>` for the ones the updater hangs off its own table. Comments after
 * are ignored.
 *
 * Numbers, quoted strings and booleans are all config the appendix prints, so
 * all three are read here; the kind decides how the printed value is checked.
 */
function constants(src) {
  const out = new Map();
  const re =
    /^(?:local\s+|[a-z][A-Za-z0-9_]*\.)([A-Z][A-Z0-9_]*)\s*=\s*(?:(-?\d+(?:\.\d+)?)|"([^"]*)"|(true|false))\s*(?:--.*)?$/gm;
  for (const m of src.matchAll(re)) {
    const [, name, num, str, bool] = m;
    if (num !== undefined) out.set(name, { kind: 'number', value: Number(num) });
    else out.set(name, { kind: 'literal', value: str !== undefined ? str : bool });
  }
  return out;
}

/** The keys of the `FUEL_ITEMS` table, minus their namespace. */
function fuelItems(src) {
  const block = src.match(/local\s+FUEL_ITEMS\s*=\s*\{([\s\S]*?)\}/);
  if (!block) return [];
  return [...block[1].matchAll(/\["([^"]+)"\]/g)].map((m) =>
    m[1].replace(/^minecraft:/, '').replace(/_/g, ' '),
  );
}

/** Test names in source order. */
function testNames(src) {
  return [...src.matchAll(/^\s*test\s*\(\s*"([^"]+)"/gm)].map((m) => m[1]);
}

/** Thousands separators are typography, not value. */
const digits = (s) => s.replace(/(\d),(?=\d)/g, '$1');

/** Whole-number match, so 3 cannot satisfy a prose that only says 32. */
const hasNumber = (prose, n) =>
  new RegExp(`(?<!\\d)${String(n).replace(/\./g, '\\.')}(?!\\d)`).test(digits(prose));

/** A version, a branch, a file suffix: printed as itself, so it must appear. */
const hasLiteral = (prose, s) => prose.toLowerCase().includes(String(s).toLowerCase());

// ------------------------------------------------- 1. appendix constants

for (const section of specs) {
  const src = lua[section.source];
  if (!src) {
    fail(`${section.heading}`, `unknown source file ${section.source}`);
    continue;
  }
  const consts = constants(src);

  for (const [label, value, ident] of section.rows) {
    const names = ident.split(/[^A-Z0-9_]+/).filter((n) => /^[A-Z][A-Z0-9_]*$/.test(n));

    // Rows with no identifier describe the platform, not the program.
    if (names.length === 0) continue;

    if (names.length === 1 && names[0] === 'FUEL_ITEMS') {
      // Compared as sets in BOTH directions: asking only whether each Lua
      // item is named in the prose passes happily when one is deleted from
      // the table, since the survivors are all still listed.
      const items = fuelItems(src);
      const listed = value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const lower = items.map((i) => i.toLowerCase());
      const omitted = lower.filter((i) => !listed.includes(i));
      const invented = listed.filter((i) => !lower.includes(i));

      if (items.length === 0) fail(`${section.source} FUEL_ITEMS`, 'no items parsed');
      else if (omitted.length) fail('FUEL_ITEMS', `accepted but not listed: ${omitted.join(', ')}`);
      else if (invented.length) fail('FUEL_ITEMS', `listed but not accepted: ${invented.join(', ')}`);
      else pass(`${ident}`, `${items.length} items, set-equal to "${value}"`);
      continue;
    }

    const entries = [];
    let unknown = false;
    for (const n of names) {
      if (!consts.has(n)) {
        fail(`${section.source} ${n}`, `no such constant (row "${label}")`);
        unknown = true;
        break;
      }
      entries.push(consts.get(n));
    }
    if (unknown) continue;

    // A version, a branch name, a boolean flag: there is no arithmetic to do,
    // so the appendix has to carry the Lua literal somewhere in its wording.
    if (entries.some((e) => e.kind === 'literal')) {
      if (entries.length !== 1) {
        fail(`${ident}`, `${section.source} pairs a string with a number (row "${label}")`);
        continue;
      }
      const literal = entries[0].value;
      if (!hasLiteral(value, literal)) {
        fail(`${names[0]}`, `${section.source} has "${literal}", appendix says "${value}"`);
      } else {
        pass(`${names[0]}`, `"${literal}" appears in "${value}"`);
      }
      continue;
    }

    const values = entries.map((e) => e.value);

    // A composite like WIDTH x LENGTH must appear as the pair, not just as
    // two numbers that happen to be somewhere in the sentence.
    if (values.length === 2) {
      const pair = new RegExp(`(?<!\\d)${values[0]}\\s*[x×]\\s*${values[1]}(?!\\d)`, 'i');
      if (!pair.test(digits(value))) {
        fail(`${ident}`, `${section.source} has ${values.join(' × ')}, appendix says "${value}"`);
      } else {
        pass(`${ident}`, `${values.join(' × ')} matches "${value}"`);
      }
      continue;
    }

    if (!hasNumber(value, values[0])) {
      fail(`${names[0]}`, `${section.source} has ${values[0]}, appendix says "${value}"`);
    } else {
      pass(`${names[0]}`, `${values[0]} matches "${value}"`);
    }
  }
}

// ------------------------------------------------------ 2. test names

for (const suite of suites) {
  const src = luaTests[suite.source];
  if (!src) {
    fail(suite.source, 'unknown test file');
    continue;
  }
  const actual = testNames(src);

  if (actual.length === 0) {
    fail(suite.source, 'no tests parsed - has the harness changed shape?');
    continue;
  }

  // Section 7 says the names are reproduced IN FULL, so a test added over
  // there has to fail here rather than quietly making the page incomplete.
  if (actual.length !== suite.names.length) {
    fail(suite.source, `harness has ${actual.length} tests, the report lists ${suite.names.length}`);
  }

  const missing = actual.filter((n) => !suite.names.includes(n));
  const invented = suite.names.filter((n) => !actual.includes(n));
  if (missing.length) fail(suite.source, `not in the report: ${missing.map((n) => `"${n}"`).join(', ')}`);
  if (invented.length) fail(suite.source, `not in the harness: ${invented.map((n) => `"${n}"`).join(', ')}`);

  const ordered = actual.length === suite.names.length && actual.every((n, i) => n === suite.names[i]);
  if (!missing.length && !invented.length && !ordered) {
    fail(suite.source, 'names match but the report is not in source order');
  }
  if (!missing.length && !invented.length && ordered) {
    pass(suite.source, `${actual.length} names, verbatim and in source order`);
  }
}

// -------------------------------------------------------- 3. Listing 1

{
  const want = stopCondition.split('\n');
  const lines = lua['turtles/flattener.lua'].split('\n');
  const first = want[0].trim();

  let found = false;
  for (let i = 0; i + want.length <= lines.length; i += 1) {
    if (lines[i].trim() !== first) continue;
    const window = lines.slice(i, i + want.length);
    const indent = Math.min(
      ...window.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length),
    );
    const dedented = window.map((l) => l.slice(indent));
    if (dedented.join('\n') === want.join('\n')) {
      found = true;
      break;
    }
  }
  if (found) pass('Listing 1', `${want.length} lines verbatim in turtles/flattener.lua`);
  else fail('Listing 1', 'the stop condition is no longer in turtles/flattener.lua as printed');
}

// ------------------------------------------------------------- report

console.log(`Checked src/data/unit-7.js against ${root}\n`);
for (const c of checks) console.log(`  ok    ${c.what.padEnd(22)} ${c.detail}`);

if (failures.length) {
  console.error(`\n${failures.length} claim(s) in the field report no longer match the source:\n`);
  for (const f of failures) console.error(`  DRIFT ${f.what.padEnd(22)} ${f.detail}`);
  console.error('\nEither the report is wrong, or the appendix needs the new value.');
  process.exit(1);
}

console.log(`\n${checks.length} claim(s) verified.`);
