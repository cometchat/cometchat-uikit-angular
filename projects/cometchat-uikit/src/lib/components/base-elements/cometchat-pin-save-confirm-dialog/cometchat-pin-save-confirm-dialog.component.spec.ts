/**
 * Shared pin/save confirm dialog Tests
 *
 * One component for unpin, unsave and unpin-conversation, ported from the React
 * kit's `CometChatPinSaveConfirmDialog`. It replaced four call sites that each
 * repeated the same overlay, string bindings and token overrides, so what
 * matters here is that the copy follows the action and the outputs fire.
 *
 * @module components/base-elements/cometchat-pin-save-confirm-dialog
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CometChatPinSaveConfirmDialogComponent,
  PinSaveConfirmAction,
} from './cometchat-pin-save-confirm-dialog.component';

describe('CometChatPinSaveConfirmDialogComponent', () => {
  let fixture: ComponentFixture<CometChatPinSaveConfirmDialogComponent>;
  let component: CometChatPinSaveConfirmDialogComponent;
  let el: HTMLElement;

  async function build(action: PinSaveConfirmAction) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatPinSaveConfirmDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatPinSaveConfirmDialogComponent);
    component = fixture.componentInstance;
    component.action = action;
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(async () => {
    await build('unpin');
  });

  it('renders its own overlay, so no host has to supply one', () => {
    expect(el.querySelector('.cometchat-pin-save-confirm-dialog')).toBeTruthy();
  });

  it('takes unpin copy from the message-unpin strings', () => {
    expect(component.title).toBe('Unpin Message');
    expect(component.confirmButtonText).toBe('Unpin');
  });

  it('switches the whole set of copy with the action', async () => {
    await build('unsave');
    expect(component.title).toBe('Unsave Message');
    expect(component.confirmButtonText).toBe('Unsave');
  });

  it('has a third variant for a conversation, not just messages', async () => {
    await build('unpin-conversation');
    expect(component.title).toBe('Unpin Conversation');
    expect(component.confirmButtonText).toBe('Unpin');
  });

  it('always offers a way out', () => {
    expect(component.cancelButtonText).toBe('Cancel');
  });

  it('forwards confirm and cancel to the host', () => {
    const confirmed = vi.fn();
    const cancelled = vi.fn();
    component.confirmClick.subscribe(confirmed);
    component.cancelClick.subscribe(cancelled);

    const buttons = Array.from(el.querySelectorAll('button')) as HTMLElement[];
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    buttons.forEach(b => b.click());

    // The host owns the action itself; this component only asks the question.
    expect(confirmed).toHaveBeenCalledTimes(1);
    expect(cancelled).toHaveBeenCalledTimes(1);
  });
});
