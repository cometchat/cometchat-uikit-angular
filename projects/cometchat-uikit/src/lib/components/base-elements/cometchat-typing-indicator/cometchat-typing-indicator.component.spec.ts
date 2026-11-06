/**
 * CometChatTypingIndicator Component Tests
 *
 * Exercises the real component through TestBed. An earlier version of this spec
 * declared a local `MockCometChatTypingIndicatorComponent` and asserted against
 * that copy, so the component itself was never executed and the logic here could
 * drift from the component's without a single test failing.
 *
 * Categories: Instantiation, Display Text, Typing User Names, Counts,
 *             Rendering, ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.2
 *
 * @module components/base-elements/cometchat-typing-indicator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTypingIndicatorComponent } from './cometchat-typing-indicator.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

/** A TypingIndicator whose sender reports the given name. */
function typist(name: string, uid = name.toLowerCase()): CometChat.TypingIndicator {
  return {
    getSender: () => ({ getUid: () => uid, getName: () => name }),
  } as unknown as CometChat.TypingIndicator;
}

/** A TypingIndicator whose sender is missing entirely. */
function senderlessTypist(): CometChat.TypingIndicator {
  return { getSender: () => undefined } as unknown as CometChat.TypingIndicator;
}

describe('CometChatTypingIndicatorComponent', () => {
  let fixture: ComponentFixture<CometChatTypingIndicatorComponent>;
  let component: CometChatTypingIndicatorComponent;
  let el: HTMLElement;

  /** Applies inputs and flushes change detection. */
  function render(typingUsers: CometChat.TypingIndicator[], isGroupChat = false): void {
    component.typingUsers = typingUsers;
    component.isGroupChat = isGroupChat;
    fixture.detectChanges();
  }

  function root(): HTMLElement | null {
    return el.querySelector('.cometchat-typing-indicator');
  }

  function text(): string {
    return el.querySelector('.cometchat-typing-indicator__text')?.textContent?.trim() ?? '';
  }

  function names(): string[] {
    return Array.from(el.querySelectorAll('.cometchat-typing-indicator__name')).map(
      n => n.textContent?.trim() ?? ''
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatTypingIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatTypingIndicatorComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  // -------------------------------------------------------------------------
  // Instantiation
  // -------------------------------------------------------------------------

  describe('Instantiation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should default typingUsers to an empty array', () => {
      expect(component.typingUsers).toEqual([]);
    });

    it('should default isGroupChat to false', () => {
      expect(component.isGroupChat).toBe(false);
    });

    it('should round-trip the typingUsers input', () => {
      const users = [typist('Alice')];
      component.typingUsers = users;
      expect(component.typingUsers).toBe(users);
    });

    it('should round-trip the isGroupChat input', () => {
      component.isGroupChat = true;
      expect(component.isGroupChat).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // displayText
  // -------------------------------------------------------------------------

  describe('displayText', () => {
    it('should be empty when nobody is typing', () => {
      render([]);
      expect(component.displayText()).toBe('');
    });

    it('should use the plain typing key in a one-to-one chat', () => {
      render([typist('Alice')], false);
      expect(component.displayText()).toBe('message_header_typing');
    });

    it('should use the plain typing key in a one-to-one chat even with several typists', () => {
      render([typist('Alice'), typist('Bob')], false);
      expect(component.displayText()).toBe('message_header_typing');
    });

    it('should use the single-user key for one typist in a group', () => {
      render([typist('Alice')], true);
      expect(component.displayText()).toBe('message_header_is_typing');
    });

    it('should use the two-user key for two typists in a group', () => {
      render([typist('Alice'), typist('Bob')], true);
      expect(component.displayText()).toBe('message_header_are_typing');
    });

    it('should use the many-user key for three or more typists in a group', () => {
      render([typist('Alice'), typist('Bob'), typist('Carol')], true);
      expect(component.displayText()).toBe('message_header_others_typing');
    });

    it('should recompute when the typists change', () => {
      render([typist('Alice')], true);
      expect(component.displayText()).toBe('message_header_is_typing');

      render([typist('Alice'), typist('Bob')], true);
      expect(component.displayText()).toBe('message_header_are_typing');
    });

    it('should recompute when the chat switches to a group', () => {
      render([typist('Alice')], false);
      expect(component.displayText()).toBe('message_header_typing');

      component.isGroupChat = true;
      expect(component.displayText()).toBe('message_header_is_typing');
    });
  });

  // -------------------------------------------------------------------------
  // Typing user names
  // -------------------------------------------------------------------------

  describe('Typing user names', () => {
    it('should expose the first typist name', () => {
      render([typist('Alice')], true);
      expect(component.firstTypingUserName).toBe('Alice');
    });

    it('should expose the second typist name', () => {
      render([typist('Alice'), typist('Bob')], true);
      expect(component.secondTypingUserName).toBe('Bob');
    });

    it('should return an empty first name when nobody is typing', () => {
      render([]);
      expect(component.firstTypingUserName).toBe('');
    });

    it('should return an empty second name when only one person is typing', () => {
      render([typist('Alice')], true);
      expect(component.secondTypingUserName).toBe('');
    });

    it('should tolerate a typist with no sender', () => {
      render([senderlessTypist()], true);
      expect(component.firstTypingUserName).toBe('');
    });

    it('should tolerate a second typist with no sender', () => {
      render([typist('Alice'), senderlessTypist()], true);
      expect(component.secondTypingUserName).toBe('');
    });

    it('should ignore anyone beyond the second typist', () => {
      render([typist('Alice'), typist('Bob'), typist('Carol')], true);
      expect(component.firstTypingUserName).toBe('Alice');
      expect(component.secondTypingUserName).toBe('Bob');
    });
  });

  // -------------------------------------------------------------------------
  // Counts
  // -------------------------------------------------------------------------

  describe('Counts', () => {
    it('should report no typists for an empty array', () => {
      render([]);
      expect(component.hasTypingUsers).toBe(false);
      expect(component.typingUsersCount).toBe(0);
    });

    it('should report typists when present', () => {
      render([typist('Alice'), typist('Bob')], true);
      expect(component.hasTypingUsers).toBe(true);
      expect(component.typingUsersCount).toBe(2);
    });

    it('should count a long list', () => {
      render(Array.from({ length: 7 }, (_, i) => typist(`User${i}`)), true);
      expect(component.typingUsersCount).toBe(7);
    });
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render nothing when nobody is typing', () => {
      render([]);
      expect(root()).toBeNull();
    });

    it('should render the indicator when someone is typing', () => {
      render([typist('Alice')]);
      expect(root()).not.toBeNull();
    });

    it('should render three animated dots', () => {
      render([typist('Alice')]);
      expect(el.querySelectorAll('.cometchat-typing-indicator__dot')).toHaveLength(3);
    });

    it('should hide the dots from assistive tech', () => {
      render([typist('Alice')]);
      expect(
        el.querySelector('.cometchat-typing-indicator__dots')?.getAttribute('aria-hidden')
      ).toBe('true');
    });

    it('should show no names in a one-to-one chat', () => {
      render([typist('Alice')], false);
      expect(names()).toHaveLength(0);
    });

    it('should show one name for a single group typist', () => {
      render([typist('Alice')], true);
      expect(names()).toEqual(['Alice']);
    });

    it('should show both names for two group typists', () => {
      render([typist('Alice'), typist('Bob')], true);
      expect(names()).toEqual(['Alice', 'Bob']);
    });

    it('should show no names for three or more group typists', () => {
      render([typist('Alice'), typist('Bob'), typist('Carol')], true);
      expect(names()).toHaveLength(0);
      expect(text()).toBeTruthy();
    });

    it('should disappear again when typing stops', () => {
      render([typist('Alice')]);
      expect(root()).not.toBeNull();

      render([]);
      expect(root()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // ARIA
  // -------------------------------------------------------------------------

  describe('ARIA', () => {
    it('should expose the indicator as a polite live status region', () => {
      render([typist('Alice')]);
      expect(root()?.getAttribute('role')).toBe('status');
      expect(root()?.getAttribute('aria-live')).toBe('polite');
    });

    it('should give an empty label when nobody is typing', () => {
      render([]);
      expect(component.ariaLabel).toBe('');
    });

    it('should give a label for a one-to-one chat', () => {
      render([typist('Alice')], false);
      expect(component.ariaLabel).toBeTruthy();
    });

    it('should name the typist in a group label', () => {
      render([typist('Alice')], true);
      expect(component.ariaLabel).toContain('Alice');
    });

    it('should name both typists in a two-person group label', () => {
      render([typist('Alice'), typist('Bob')], true);
      expect(component.ariaLabel).toContain('Alice');
      expect(component.ariaLabel).toContain('Bob');
    });

    it('should give a collective label for three or more typists', () => {
      render([typist('Alice'), typist('Bob'), typist('Carol')], true);
      expect(component.ariaLabel).toBeTruthy();
      expect(component.ariaLabel).not.toContain('Carol');
    });

    it('should leave no unresolved placeholders in any label', () => {
      for (const users of [[typist('Alice')], [typist('Alice'), typist('Bob')]]) {
        render(users, true);
        expect(component.ariaLabel).not.toMatch(/\{name\d?\}/);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('Edge cases', () => {
    it('should treat a null typingUsers as nobody typing', () => {
      component.typingUsers = null as unknown as CometChat.TypingIndicator[];
      fixture.detectChanges();

      expect(component.hasTypingUsers).toBeFalsy();
      expect(component.typingUsersCount).toBe(0);
      expect(component.displayText()).toBe('');
      expect(component.ariaLabel).toBe('');
    });

    it('should tolerate an undefined typingUsers', () => {
      component.typingUsers = undefined as unknown as CometChat.TypingIndicator[];
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.typingUsersCount).toBe(0);
    });

    it('should handle a typist whose name is empty', () => {
      render([typist('')], true);
      expect(component.firstTypingUserName).toBe('');
      expect(root()).not.toBeNull();
    });

    it('should survive rapid alternation between states', () => {
      for (let i = 0; i < 5; i++) {
        render([typist('Alice')], true);
        render([], true);
      }
      expect(root()).toBeNull();
    });
  });

  describe('ariaLabel with special characters in names', () => {
    it("reads one typist whose name contains $&, $' and $$ literally", () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) =>
        key === 'accessibility_user_is_typing' ? '{name} is typing' : key
      );
      render([typist("A$&B$'C$$D", 'a')], true);
      expect(component.ariaLabel).toBe("A$&B$'C$$D is typing");
      vi.restoreAllMocks();
    });

    it('reads two typists whose names contain $& and $$ literally', () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) =>
        key === 'accessibility_two_users_typing' ? '{name1} and {name2} are typing' : key
      );
      render([typist('A$&B', 'a'), typist('C$$D', 'c')], true);
      expect(component.ariaLabel).toBe('A$&B and C$$D are typing');
      vi.restoreAllMocks();
    });

    it('does not fill a placeholder that appears inside a typist\'s name', () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) =>
        key === 'accessibility_two_users_typing' ? '{name1} and {name2} are typing' : key
      );
      render([typist('{name2}', 'a'), typist('Bob', 'b')], true);
      expect(component.ariaLabel).toBe('{name2} and Bob are typing');
      vi.restoreAllMocks();
    });
  });
});
