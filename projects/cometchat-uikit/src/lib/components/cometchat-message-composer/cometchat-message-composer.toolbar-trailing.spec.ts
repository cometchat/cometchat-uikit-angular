/**
 * Composer — toolbarTrailingView slot Tests
 *
 * The consumer slot at the trailing end of the rich-text formatting toolbar,
 * ported from the React kit's `toolbarTrailingView`. Covers: nothing rendered
 * when unset, the auto-inserted separator, placement after the built-in groups,
 * the `composer` handle in the context, and the toolbar gates.
 *
 * @module components/cometchat-message-composer/toolbar-trailing
 */

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatMessageComposerComponent } from './cometchat-message-composer.component';

const TOOLBAR = '.cometchat-message-composer__toolbar';
const TRAILING = '.spec-trailing-button';
const SEPARATOR = '.cometchat-message-composer__toolbar-separator';

@Component({
  standalone: true,
  imports: [CometChatMessageComposerComponent],
  template: `
    <cometchat-message-composer
      [enableRichText]="true"
      [layout]="'multiline'"
      [hideRichTextToolbar]="hideToolbar"
      [toolbarTrailingView]="slot ? trailing : undefined"
    ></cometchat-message-composer>

    <ng-template #trailing let-composer="composer">
      <button class="spec-trailing-button" (click)="seen = composer">Custom</button>
    </ng-template>
  `,
})
class HostComponent {
  slot = true;
  hideToolbar = false;
  seen: unknown = null;
  @ViewChild(CometChatMessageComposerComponent) composer!: CometChatMessageComposerComponent;
}

describe('CometChatMessageComposer — toolbarTrailingView', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  async function build(slot = true, hideToolbar = false) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.slot = slot;
    host.hideToolbar = hideToolbar;
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(async () => {
    await build();
  });

  it('renders the consumer content inside the toolbar', () => {
    const toolbar = el.querySelector(TOOLBAR);
    expect(toolbar).toBeTruthy();
    expect(toolbar!.querySelector(TRAILING)).toBeTruthy();
  });

  it('renders nothing at all when the slot is unset', async () => {
    await build(false);
    expect(el.querySelector(TRAILING)).toBeNull();
  });

  it('sits after the built-in formatting buttons, not before them', () => {
    const toolbar = el.querySelector(TOOLBAR)!;
    const children = Array.from(toolbar.children);
    const trailingIndex = children.findIndex(c => c.matches(TRAILING) || c.querySelector(TRAILING));
    const lastBuiltIn = children.reduce(
      (last, child, i) => (child.querySelector('.cometchat-message-composer__toolbar-icon') ? i : last),
      -1
    );
    expect(trailingIndex).toBeGreaterThan(lastBuiltIn);
  });

  it('inserts its own separator, so the slot is not left bolted on', async () => {
    const withSlot = el.querySelectorAll(SEPARATOR).length;
    await build(false);
    const withoutSlot = el.querySelectorAll(SEPARATOR).length;
    // Exactly one extra divider appears — the built-in groups keep theirs.
    expect(withSlot).toBe(withoutSlot + 1);
  });

  it('hands the composer to the template so a button can act on the editor', () => {
    (el.querySelector(TRAILING) as HTMLElement).click();
    fixture.detectChanges();
    // A template cannot otherwise reach the rich-text editor to apply a format.
    expect(host.seen).toBe(host.composer);
  });

  it('is gone when the integrator hides the rich-text toolbar', async () => {
    // The slot lives inside the toolbar, so hiding the toolbar takes it with it —
    // a consumer button must not survive as an orphan above the input.
    await build(true, true);
    expect(el.querySelector(TOOLBAR)).toBeNull();
    expect(el.querySelector(TRAILING)).toBeNull();
  });
});
