// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectComponents, exercised } from './prop-coverage.mjs';

const dir = mkdtempSync(join(tmpdir(), 'prop-coverage-'));
const componentFile = join(dir, 'demo.component.ts');
writeFileSync(
  componentFile,
  `import { Component, Input, Output, EventEmitter, input, output, model, booleanAttribute } from '@angular/core';
@Component({ selector: 'demo', template: '' })
export class DemoComponent {
  @Input() title = '';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() set theme(v: string) {}
  size = input<number>(1);
  user = input.required<string>();
  value = model<string>('');
  @Output() closed = new EventEmitter<void>();
  picked = output<string>();
  private helper = 1;
}
export class NotAComponent { @Input() ignored = ''; }`
);
const [demo] = collectComponents([componentFile]);

describe('prop-coverage', () => {
  it('finds decorator, setter, signal and model inputs and outputs of components only', () => {
    expect(demo.name).toBe('DemoComponent');
    expect([...demo.inputs].sort()).toEqual(['disabled', 'size', 'theme', 'title', 'user', 'value']);
    expect([...demo.outputs].sort()).toEqual(['closed', 'picked', 'value']);
  });

  it('counts setInput, assignment and template bindings as exercising an input', () => {
    const spec = `fixture.componentRef.setInput('size', 2); component.title = 'x'; template: '<demo [disabled]="true" [(value)]="v">'`;
    expect(exercised(demo, [spec]).inputs.sort()).toEqual(['disabled', 'size', 'title', 'value']);
  });

  it('does not count a comparison or an unrelated mention as exercising an input', () => {
    expect(exercised(demo, [`expect(component.title === 'x'); // theme user`]).inputs).toEqual([]);
  });

  it('counts subscribe, emit spies and event bindings as exercising an output', () => {
    const spec = `component.closed.subscribe(fn); spyOn(component.picked, 'emit'); '<demo (value)="x">'`;
    expect(exercised(demo, [spec]).outputs.sort()).toEqual(['closed', 'picked', 'value']);
  });

  it('leaves an untested output untested', () => {
    expect(exercised(demo, [`component.title = 'x'`]).outputs).toEqual([]);
  });
});
