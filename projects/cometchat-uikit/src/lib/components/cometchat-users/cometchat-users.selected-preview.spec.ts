// The calls SDK reaches for JitsiMeetJS at import time, which jsdom has no window for.
vi.mock('@cometchat/calls-sdk-javascript', () => ({ CometChatCalls: { init: vi.fn() } }));

/**
 * showSelectedUsersPreview on the real CometChatUsers template: the strip of chips for the users
 * picked in multiple-selection mode. Only the data service is replaced (it is declared in the
 * component's own providers, so it is swapped with overrideComponent).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUsersComponent } from './cometchat-users.component';
import { UsersService } from '../../services/users.service';
import { SelectionMode, States } from '../../Enums/Enums';

class UsersServiceStub {
  readonly users = signal<CometChat.User[]>([]).asReadonly();
  readonly fetchState = signal<States>(States.loaded).asReadonly();
  readonly hasMore = signal(false).asReadonly();
  setErrorCallback(): void {}
  initialize(): void {}
  search(): void {}
  updateUser(): void {}
  cleanup(): void {}
  fetchNext(): Promise<void> {
    return Promise.resolve();
  }
}

const user = (uid: string, name: string) =>
  ({ getUid: () => uid, getName: () => name, getAvatar: () => '', getStatus: () => 'online' }) as unknown as CometChat.User;

describe('CometChatUsersComponent showSelectedUsersPreview', () => {
  let fixture: ComponentFixture<CometChatUsersComponent>;
  const preview = (): HTMLElement | null => fixture.nativeElement.querySelector('.cometchat-users__selected-preview');
  const chipNames = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.cometchat-users__selected-preview-chip-name')).map((e) =>
      (e as HTMLElement).textContent!.trim()
    );

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CometChatUsersComponent] });
    TestBed.overrideComponent(CometChatUsersComponent, {
      set: { providers: [{ provide: UsersService, useClass: UsersServiceStub }] },
    });
    fixture = TestBed.createComponent(CometChatUsersComponent);
    fixture.componentRef.setInput('selectionMode', SelectionMode.multiple);
    fixture.componentInstance.selectedUsersMap.set('u1', user('u1', 'Ana'));
    fixture.componentInstance.selectedUsersMap.set('u2', user('u2', 'Ben'));
  });

  it('is off by default: picked users show no preview strip', () => {
    fixture.detectChanges();
    expect(preview()).toBeNull();
  });

  it('showSelectedUsersPreview=true shows a chip per picked user', () => {
    fixture.componentRef.setInput('showSelectedUsersPreview', true);
    fixture.detectChanges();
    expect(preview()).not.toBeNull();
    expect(chipNames().sort()).toEqual(['Ana', 'Ben']);
  });

  it('shows nothing while no user is picked, even when enabled', () => {
    fixture.componentInstance.selectedUsersMap.clear();
    fixture.componentRef.setInput('showSelectedUsersPreview', true);
    fixture.detectChanges();
    expect(preview()).toBeNull();
  });
});
