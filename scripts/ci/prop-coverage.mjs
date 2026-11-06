#!/usr/bin/env node
// Prop coverage (Track 3 PROP4): every public input and output of every component must be
// exercised by a unit test. Untested props that existed when the gate was introduced are listed
// in scripts/ci/prop-coverage-baseline.json; a prop missing from a test and not in that list
// (a new one, or one whose test was removed) fails, and props that gain a test must be pruned
// from the list (--update), so it only shrinks.
//
// Inputs: @Input() properties and setters, input(), input.required(), model().
// Outputs: @Output() properties, output(), model().
// A prop counts as exercised when a spec that names the component class does one of:
//   inputs   setInput('name', …) · `.name = …` · a template binding [name]= / [(name)]=
//   outputs  `.name.subscribe(` · `.name.emit` · spyOn(…, 'emit') on `.name` · (name)= / [(name)]=
// The same measurement as Track 3 §2.5's strict count.
//
//   node scripts/ci/prop-coverage.mjs            check against the baseline
//   node scripts/ci/prop-coverage.mjs --update   rewrite the baseline from the current tests
//   node scripts/ci/prop-coverage.mjs --report   per-component table
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const LIB = 'projects/cometchat-uikit/src';
const BASELINE = 'scripts/ci/prop-coverage-baseline.json';

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(LIB);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Components and their inputs/outputs, from the TypeScript AST. */
export function collectComponents(paths) {
  const components = [];
  for (const file of paths) {
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    sf.forEachChild((node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;
      const decorators = ts.getDecorators(node) ?? [];
      if (!decorators.some((d) => ts.isCallExpression(d.expression) && d.expression.expression.getText() === 'Component')) return;
      const inputs = new Set();
      const outputs = new Set();
      for (const m of node.members) {
        if (!m.name || !(ts.isIdentifier(m.name) || ts.isStringLiteral(m.name))) continue;
        const name = m.name.text;
        const memberDecorators = (ts.canHaveDecorators(m) && ts.getDecorators(m)) || [];
        for (const d of memberDecorators) {
          const id = ts.isCallExpression(d.expression) ? d.expression.expression.getText() : '';
          if (id === 'Input') inputs.add(name);
          if (id === 'Output') outputs.add(name);
        }
        if (ts.isPropertyDeclaration(m) && m.initializer && ts.isCallExpression(m.initializer)) {
          const callee = m.initializer.expression.getText();
          if (callee === 'input' || callee === 'input.required') inputs.add(name);
          if (callee === 'output' || callee === 'outputFromObservable') outputs.add(name);
          if (callee === 'model' || callee === 'model.required') (inputs.add(name), outputs.add(name));
        }
      }
      if (inputs.size || outputs.size) components.push({ file: relative('.', file), name: node.name.text, inputs, outputs });
    });
  }
  return components;
}

/** Props of `component` that `specs` (contents of specs naming it) exercise. */
export function exercised(component, specs) {
  const text = specs.join('\n');
  const hit = (name, kind) => {
    const n = escape(name);
    const patterns =
      kind === 'input'
        ? [`setInput\\(\\s*['"\`]${n}['"\`]`, `\\.${n}\\s*=(?!=)`, `\\[\\(?${n}\\)?\\]\\s*=`]
        : [`\\.${n}\\.(subscribe|emit)\\b`, `spyOn\\([^,]*\\.${n}\\s*,\\s*['"]emit['"]`, `(\\(|\\[\\()${n}\\)\\]?\\s*=`];
    return patterns.some((p) => new RegExp(p).test(text));
  };
  return {
    inputs: [...component.inputs].filter((i) => hit(i, 'input')),
    outputs: [...component.outputs].filter((o) => hit(o, 'output')),
  };
}

function measure() {
  const components = collectComponents(files.filter((f) => f.endsWith('.component.ts')));
  const specFiles = files.filter((f) => f.endsWith('.spec.ts')).map((f) => readFileSync(f, 'utf8'));
  const untested = [];
  const rows = [];
  let total = 0;
  let covered = 0;
  for (const c of components) {
    const classRe = new RegExp(`\\b${c.name}\\b`);
    const ex = exercised(c, specFiles.filter((s) => classRe.test(s)));
    for (const i of c.inputs) if (!ex.inputs.includes(i)) untested.push(`${c.name}.${i} (input)`);
    for (const o of c.outputs) if (!ex.outputs.includes(o)) untested.push(`${c.name}.${o} (output)`);
    const n = c.inputs.size + c.outputs.size;
    const k = ex.inputs.length + ex.outputs.length;
    total += n;
    covered += k;
    rows.push({ c, inputs: `${ex.inputs.length}/${c.inputs.size}`, outputs: `${ex.outputs.length}/${c.outputs.size}` });
  }
  return { components, untested: untested.sort(), total, covered, rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { components, untested, total, covered, rows } = measure();
  const pct = ((covered / total) * 100).toFixed(1);
  const summary = `Prop coverage: ${covered} of ${total} inputs/outputs exercised by unit tests (${pct}%), ${components.length} components.`;

  if (process.argv.includes('--report')) {
    for (const r of rows) console.log(`${r.c.name.padEnd(56)} inputs ${r.inputs.padStart(7)}  outputs ${r.outputs.padStart(7)}`);
    console.log(`\n${summary}`);
    process.exit(0);
  }
  if (process.argv.includes('--update')) {
    writeFileSync(BASELINE, JSON.stringify({ measured: new Date().toISOString().slice(0, 10), untested }, null, 2) + '\n');
    console.log(`${summary}\nBaseline set: ${untested.length} untested props.`);
    process.exit(0);
  }

  const baseline = new Set(JSON.parse(readFileSync(BASELINE, 'utf8')).untested);
  const added = untested.filter((p) => !baseline.has(p));
  const nowTested = [...baseline].filter((p) => !untested.includes(p));
  console.log(summary);
  if (added.length) {
    console.error(`\n✗ ${added.length} input(s)/output(s) have no unit test exercising them:`);
    for (const p of added) console.error(`  ${p}`);
    console.error('\nAdd a test that sets the input (setInput, assignment or [binding]) or listens to the output.');
  }
  if (nowTested.length) {
    console.error(`\n✗ ${nowTested.length} prop(s) in the baseline are tested now. Lock that in:`);
    console.error('  run `node scripts/ci/prop-coverage.mjs --update` and commit the baseline.');
  }
  if (added.length || nowTested.length) process.exit(1);
  console.log(`✓ No new untested props (${baseline.size} in the baseline, which may only shrink).`);
}
