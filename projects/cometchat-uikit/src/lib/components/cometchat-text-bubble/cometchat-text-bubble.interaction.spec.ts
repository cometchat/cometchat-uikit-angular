/**
 * CometChatTextBubble — input plumbing, truncation and click handlers
 *
 * Covers the parts of the component that react to the outside world:
 *   - the textFormatters setter and the three-tier priority behind
 *     effectiveTextFormatters() (explicit input > GlobalConfig > [])
 *   - ngOnChanges re-processing
 *   - ngAfterViewInit / checkContentTruncation height threshold
 *   - toggleReadMore, onLinkPreviewClick, onMentionClick, onTextContentClick
 *   - getDomainFromUrl delegation
 *
 * The component is built directly through TestBed.runInInjectionContext rather
 * than as a fixture: every behaviour under test lives in plain class methods,
 * and skipping template rendering keeps these tests free of the async formatter
 * bootstrap and of jsdom layout (which always reports scrollHeight 0).
 *
 * @module components/cometchat-text-bubble
 */

// The calls SDK reaches for JitsiMeetJS at import time, which does not exist in jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatTextBubbleComponent } from './cometchat-text-bubble.component';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { MessageBubbleAlignment, MouseEventSource } from '../../Enums/Enums';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Configures the TestBed and builds the component.
 * Construction happens inside an injection context because the component
 * calls inject(COMETCHAT_GLOBAL_CONFIG) at field level.
 */
function makeComponent(providers: unknown[] = []): CometChatTextBubbleComponent {
  TestBed.configureTestingModule({
    providers: [FormatterConfigService, HtmlSanitizerService, ...(providers as never[])],
  });

  const sanitizer = TestBed.inject(DomSanitizer);
  const formatterConfig = TestBed.inject(FormatterConfigService);
  const htmlSanitizer = TestBed.inject(HtmlSanitizerService);
  const cdr = { detectChanges: vi.fn(), markForCheck: vi.fn() } as never;

  let comp!: CometChatTextBubbleComponent;
  TestBed.runInInjectionContext(() => {
    comp = new CometChatTextBubbleComponent(sanitizer, cdr, formatterConfig, htmlSanitizer);
  });
  return comp;
}

/** The mocked ChangeDetectorRef handed to the component, for markForCheck assertions. */
function cdrOf(comp: CometChatTextBubbleComponent): { markForCheck: ReturnType<typeof vi.fn> } {
  return (comp as unknown as { cdr: { markForCheck: ReturnType<typeof vi.fn> } }).cdr;
}

/**
 * A non-mentions formatter. Identity is all these tests compare, so the
 * CometChatTextFormatter contract is satisfied with the three members the
 * component actually touches.
 */
function makeFormatter(id: string): CometChatTextFormatter {
  return {
    id,
    shouldFormat: () => false,
    format: (text: string) => text,
  } as unknown as CometChatTextFormatter;
}

function makeUser(uid: string, name = uid): CometChat.User {
  return new CometChat.User({ uid, name } as never);
}

function makeTextMessage(text: string): CometChat.TextMessage {
  return new CometChat.TextMessage('receiver-uid', text, CometChat.RECEIVER_TYPE.USER);
}

/** Stubs the ViewChild the truncation check reads. */
function stubContentElement(comp: CometChatTextBubbleComponent, scrollHeight: number): void {
  (comp as unknown as { contentElement: unknown }).contentElement = {
    nativeElement: { scrollHeight },
  };
}

/**
 * Builds a click event whose target is `el`. The target of a synthetic event is
 * read-only until dispatch, so it is defined explicitly instead.
 */
function clickEventOn(el: HTMLElement | null): {
  event: MouseEvent;
  preventDefault: ReturnType<typeof vi.spyOn>;
  stopPropagation: ReturnType<typeof vi.spyOn>;
} {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'target', { value: el });
  const preventDefault = vi.spyOn(event, 'preventDefault');
  const stopPropagation = vi.spyOn(event, 'stopPropagation');
  return { event, preventDefault, stopPropagation };
}

function anchor(className: string, href?: string): HTMLElement {
  const a = document.createElement('a');
  if (className) a.className = className;
  if (href !== undefined) a.setAttribute('href', href);
  return a;
}

function mentionSpan(attrs: Record<string, string>, className = 'cometchat-mentions'): HTMLElement {
  const span = document.createElement('span');
  span.className = className;
  Object.entries(attrs).forEach(([k, v]) => span.setAttribute(k, v));
  return span;
}

/** Invokes the protected click handler. */
function clickText(comp: CometChatTextBubbleComponent, event: MouseEvent): void {
  (comp as unknown as { onTextContentClick(e: MouseEvent): void }).onTextContentClick(event);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CometChatTextBubbleComponent — inputs, truncation and click handling', () => {
  let subscriptions: Subscription[];
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    subscriptions = [];
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    subscriptions.forEach(s => s.unsubscribe());
    openSpy.mockRestore();
    vi.restoreAllMocks();
  });

  /** Collects every ccMouseEvent published while the test runs. */
  function captureMouseEvents(): unknown[] {
    const seen: unknown[] = [];
    subscriptions.push(CometChatUIEvents.ccMouseEvent.subscribe(e => seen.push(e)));
    return seen;
  }

  // -------------------------------------------------------------------------
  // textFormatters setter / getter
  // -------------------------------------------------------------------------
  describe('textFormatters input', () => {
    it('stores an explicit non-empty array and exposes it through the getter', () => {
      const comp = makeComponent();
      const formatters = [makeFormatter('a'), makeFormatter('b')];

      comp.textFormatters = formatters;

      expect(comp.textFormatters).toEqual(formatters);
      expect(comp.textFormatters[0]).toBe(formatters[0]);
    });

    it('marks the input as explicitly set for a non-null value', () => {
      const comp = makeComponent();

      comp.textFormatters = [makeFormatter('a')];

      expect((comp as any).textFormattersExplicitlySet()).toBe(true);
    });

    it('starts with an empty array and no explicit flag', () => {
      const comp = makeComponent();

      expect(comp.textFormatters).toEqual([]);
      expect((comp as any).textFormattersExplicitlySet()).toBe(false);
    });

    it('ignores undefined — neither stored nor marked explicit', () => {
      const comp = makeComponent();

      comp.textFormatters = undefined;

      expect(comp.textFormatters).toEqual([]);
      expect((comp as any).textFormattersExplicitlySet()).toBe(false);
    });

    it('ignores null — neither stored nor marked explicit', () => {
      const comp = makeComponent();

      (comp as any).textFormatters = null;

      expect(comp.textFormatters).toEqual([]);
      expect((comp as any).textFormattersExplicitlySet()).toBe(false);
    });

    it('keeps a previously set array when undefined arrives later', () => {
      const comp = makeComponent();
      const formatters = [makeFormatter('keep-me')];

      comp.textFormatters = formatters;
      comp.textFormatters = undefined;

      expect(comp.textFormatters).toEqual(formatters);
      expect(comp.effectiveTextFormatters()).toEqual(formatters);
    });

    it('keeps a previously set array when null arrives later', () => {
      const comp = makeComponent();
      const formatters = [makeFormatter('keep-me')];

      comp.textFormatters = formatters;
      (comp as any).textFormatters = null;

      expect(comp.textFormatters).toEqual(formatters);
      expect((comp as any).textFormattersExplicitlySet()).toBe(true);
    });

    it('replaces a previously set array when a new non-null array arrives', () => {
      const comp = makeComponent();
      const first = [makeFormatter('first')];
      const second = [makeFormatter('second')];

      comp.textFormatters = first;
      comp.textFormatters = second;

      expect(comp.textFormatters).toEqual(second);
    });
  });

  // -------------------------------------------------------------------------
  // effectiveTextFormatters priority
  // -------------------------------------------------------------------------
  describe('effectiveTextFormatters priority', () => {
    it('returns an empty array with no explicit input and no global config', () => {
      const comp = makeComponent();

      expect(comp.effectiveTextFormatters()).toEqual([]);
    });

    it('falls back to COMETCHAT_GLOBAL_CONFIG.textFormatters when nothing is explicit', () => {
      const globalFormatters = [makeFormatter('global-1'), makeFormatter('global-2')];
      const comp = makeComponent([
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { textFormatters: globalFormatters } },
      ]);

      const effective = comp.effectiveTextFormatters();

      expect(effective).toHaveLength(2);
      expect(effective[0]).toBe(globalFormatters[0]);
      expect(effective[1]).toBe(globalFormatters[1]);
    });

    it('returns an empty array when the global config omits textFormatters', () => {
      const comp = makeComponent([
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { hideReceipts: true } },
      ]);

      expect(comp.effectiveTextFormatters()).toEqual([]);
    });

    it('prefers an explicit array over the global config', () => {
      const globalFormatters = [makeFormatter('global')];
      const explicit = [makeFormatter('explicit')];
      const comp = makeComponent([
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { textFormatters: globalFormatters } },
      ]);

      comp.textFormatters = explicit;

      expect(comp.effectiveTextFormatters()).toEqual(explicit);
      expect(comp.effectiveTextFormatters()[0]).toBe(explicit[0]);
    });

    it('lets an explicitly set EMPTY array beat the global config', () => {
      const globalFormatters = [makeFormatter('global')];
      const comp = makeComponent([
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { textFormatters: globalFormatters } },
      ]);

      comp.textFormatters = [];

      expect((comp as any).textFormattersExplicitlySet()).toBe(true);
      expect(comp.effectiveTextFormatters()).toEqual([]);
    });

    it('still uses the global config after an undefined assignment', () => {
      const globalFormatters = [makeFormatter('global')];
      const comp = makeComponent([
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { textFormatters: globalFormatters } },
      ]);

      comp.textFormatters = undefined;

      expect(comp.effectiveTextFormatters()).toEqual(globalFormatters);
    });

    it('honours an empty global config array as the effective value', () => {
      const comp = makeComponent([
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { textFormatters: [] } },
      ]);

      expect(comp.effectiveTextFormatters()).toEqual([]);
      expect((comp as any).textFormattersExplicitlySet()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // ngOnChanges
  // -------------------------------------------------------------------------
  describe('ngOnChanges', () => {
    function changesFor(key: string, previous: unknown, next: unknown): SimpleChanges {
      return { [key]: new SimpleChange(previous, next, previous == null) };
    }

    it('re-processes the message when the message input changes', () => {
      const comp = makeComponent();
      comp.message = makeTextMessage('hello');
      const spy = vi.spyOn(comp as any, 'processMessage');

      comp.ngOnChanges(changesFor('message', null, comp.message));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('re-processes the message when alignment changes', () => {
      const comp = makeComponent();
      comp.message = makeTextMessage('hello');
      const spy = vi.spyOn(comp as any, 'processMessage');

      comp.ngOnChanges(
        changesFor('alignment', MessageBubbleAlignment.left, MessageBubbleAlignment.right)
      );

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('re-processes the message when translatedTextOverride changes', () => {
      const comp = makeComponent();
      comp.message = makeTextMessage('hello');
      const spy = vi.spyOn(comp as any, 'processMessage');

      comp.ngOnChanges(changesFor('translatedTextOverride', undefined, 'hola'));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does NOT re-process for an unrelated input key', () => {
      const comp = makeComponent();
      comp.message = makeTextMessage('hello');
      const spy = vi.spyOn(comp as any, 'processMessage');

      comp.ngOnChanges(changesFor('textFormatters', undefined, [makeFormatter('x')]));

      expect(spy).not.toHaveBeenCalled();
    });

    it('does NOT re-process for an empty changes object', () => {
      const comp = makeComponent();
      comp.message = makeTextMessage('hello');
      const spy = vi.spyOn(comp as any, 'processMessage');

      comp.ngOnChanges({});

      expect(spy).not.toHaveBeenCalled();
    });

    it('re-processes exactly once when a watched and an unwatched key change together', () => {
      const comp = makeComponent();
      comp.message = makeTextMessage('hello');
      const spy = vi.spyOn(comp as any, 'processMessage');

      comp.ngOnChanges({
        ...changesFor('message', null, comp.message),
        ...changesFor('somethingElse', 1, 2),
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('picks up the new text after a message change', () => {
      const comp = makeComponent();
      comp.message = makeTextMessage('first');
      comp.ngOnChanges(changesFor('message', null, comp.message));
      expect((comp as any).messageText).toBe('first');

      const next = makeTextMessage('second');
      comp.message = next;
      comp.ngOnChanges(changesFor('message', null, next));

      expect((comp as any).messageText).toBe('second');
    });

    it('recomputes the outgoing flag when alignment changes', () => {
      const comp = makeComponent();
      comp.message = makeTextMessage('hello');
      comp.alignment = MessageBubbleAlignment.right;

      comp.ngOnChanges(
        changesFor('alignment', MessageBubbleAlignment.left, MessageBubbleAlignment.right)
      );

      expect((comp as any).isOutgoing).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Content truncation
  // -------------------------------------------------------------------------
  describe('checkContentTruncation', () => {
    function check(comp: CometChatTextBubbleComponent): void {
      (comp as unknown as { checkContentTruncation(): void }).checkContentTruncation();
    }

    // The pre-set values matter: without them an assertion of false/0 would also
    // hold for a method that did nothing at all.
    it('clears the truncated flag and leaves the height alone without a contentElement', () => {
      const comp = makeComponent();
      (comp as any).isContentTruncated = true;
      (comp as any).contentHeight = 150;

      check(comp);

      expect((comp as any).isContentTruncated).toBe(false);
      // The early return happens before the height is re-measured, so the last
      // measured value survives.
      expect((comp as any).contentHeight).toBe(150);
      expect(cdrOf(comp).markForCheck).not.toHaveBeenCalled();
    });

    it('returns early when contentElement has no nativeElement', () => {
      const comp = makeComponent();
      (comp as any).contentElement = { nativeElement: undefined };
      (comp as any).isContentTruncated = true;

      check(comp);

      expect((comp as any).isContentTruncated).toBe(false);
      expect(cdrOf(comp).markForCheck).not.toHaveBeenCalled();
    });

    it('records the measured height and flags truncation at 120px', () => {
      const comp = makeComponent();
      stubContentElement(comp, 120);

      check(comp);

      expect((comp as any).contentHeight).toBe(120);
      expect((comp as any).isContentTruncated).toBe(true);
    });

    it('does NOT flag truncation at exactly 80px', () => {
      const comp = makeComponent();
      stubContentElement(comp, 80);
      // Start from true so the expected false proves an actual recomputation.
      (comp as any).isContentTruncated = true;

      check(comp);

      expect((comp as any).contentHeight).toBe(80);
      expect((comp as any).isContentTruncated).toBe(false);
    });

    it('flags truncation at 81px', () => {
      const comp = makeComponent();
      stubContentElement(comp, 81);

      check(comp);

      expect((comp as any).isContentTruncated).toBe(true);
    });

    // jsdom reports scrollHeight 0 for every element, so this is the height the
    // component sees in any test that renders the real template.
    it('resets height and flag for a zero-height element', () => {
      const comp = makeComponent();
      stubContentElement(comp, 0);
      // Both expectations below are the field defaults, so seed non-defaults
      // first — otherwise this test would pass against a no-op method.
      (comp as any).contentHeight = 500;
      (comp as any).isContentTruncated = true;

      check(comp);

      expect((comp as any).contentHeight).toBe(0);
      expect((comp as any).isContentTruncated).toBe(false);
    });

    it('asks for change detection once a height has been measured', () => {
      const comp = makeComponent();
      stubContentElement(comp, 200);

      check(comp);

      expect(cdrOf(comp).markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ngAfterViewInit runs the truncation check', () => {
      const comp = makeComponent();
      stubContentElement(comp, 300);

      comp.ngAfterViewInit();

      expect((comp as any).contentHeight).toBe(300);
      expect((comp as any).isContentTruncated).toBe(true);
    });

    it('ngAfterViewInit clears a stale flag when the view has no content element', () => {
      const comp = makeComponent();
      // Seeded true so this proves ngAfterViewInit really delegated to the
      // check, rather than the flag merely still sitting at its default.
      (comp as any).isContentTruncated = true;

      comp.ngAfterViewInit();

      expect((comp as any).isContentTruncated).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // toggleReadMore
  // -------------------------------------------------------------------------
  describe('toggleReadMore', () => {
    function toggle(comp: CometChatTextBubbleComponent): void {
      (comp as unknown as { toggleReadMore(): void }).toggleReadMore();
    }

    it('expands from the collapsed default', () => {
      const comp = makeComponent();
      expect((comp as any).isExpanded).toBe(false);

      toggle(comp);

      expect((comp as any).isExpanded).toBe(true);
    });

    it('collapses again on a second call', () => {
      const comp = makeComponent();

      toggle(comp);
      toggle(comp);

      expect((comp as any).isExpanded).toBe(false);
    });

    it('asks for change detection on every toggle', () => {
      const comp = makeComponent();

      toggle(comp);
      toggle(comp);

      expect(cdrOf(comp).markForCheck).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // onLinkPreviewClick
  // -------------------------------------------------------------------------
  describe('onLinkPreviewClick', () => {
    function clickPreview(comp: CometChatTextBubbleComponent, url: unknown): void {
      (comp as unknown as { onLinkPreviewClick(u: unknown): void }).onLinkPreviewClick(url);
    }

    it('does nothing for an empty url', () => {
      const comp = makeComponent();
      const emitted: string[] = [];
      comp.linkClick.subscribe(u => emitted.push(u));

      clickPreview(comp, '');

      expect(openSpy).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });

    it('does nothing for an undefined url', () => {
      const comp = makeComponent();
      const emitted: string[] = [];
      comp.linkClick.subscribe(u => emitted.push(u));

      clickPreview(comp, undefined);

      expect(openSpy).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });

    it('opens the url in a new tab with noopener,noreferrer', () => {
      const comp = makeComponent();

      clickPreview(comp, 'https://example.com/article');

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenCalledWith(
        'https://example.com/article',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('emits linkClick with the clicked url', () => {
      const comp = makeComponent();
      const emitted: string[] = [];
      comp.linkClick.subscribe(u => emitted.push(u));

      clickPreview(comp, 'https://example.com/article');

      expect(emitted).toEqual(['https://example.com/article']);
    });
  });

  // -------------------------------------------------------------------------
  // onMentionClick
  // -------------------------------------------------------------------------
  describe('onMentionClick', () => {
    function clickMention(comp: CometChatTextBubbleComponent, user: unknown): void {
      (comp as unknown as { onMentionClick(u: unknown): void }).onMentionClick(user);
    }

    it('does nothing when the user is null', () => {
      const comp = makeComponent();
      const emitted: CometChat.User[] = [];
      comp.mentionClick.subscribe(u => emitted.push(u));
      const events = captureMouseEvents();

      clickMention(comp, null);

      expect(emitted).toEqual([]);
      expect(events).toEqual([]);
    });

    it('does nothing when the user is undefined', () => {
      const comp = makeComponent();
      const emitted: CometChat.User[] = [];
      comp.mentionClick.subscribe(u => emitted.push(u));
      const events = captureMouseEvents();

      clickMention(comp, undefined);

      expect(emitted).toEqual([]);
      expect(events).toEqual([]);
    });

    it('emits mentionClick with the clicked user', () => {
      const comp = makeComponent();
      const user = makeUser('u-1', 'Alice');
      const emitted: CometChat.User[] = [];
      comp.mentionClick.subscribe(u => emitted.push(u));

      clickMention(comp, user);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe(user);
    });

    it('publishes a mentions-sourced ccMouseEvent carrying the user', () => {
      const comp = makeComponent();
      const user = makeUser('u-2', 'Bob');
      const events = captureMouseEvents();

      clickMention(comp, user);

      expect(events).toHaveLength(1);
      const payload = events[0] as any;
      expect(payload.source).toBe(MouseEventSource.mentions);
      expect(payload.body.CometChatUserGroupMembersObject).toBe(user);
      expect(payload.event).toBeInstanceOf(MouseEvent);
    });
  });

  // -------------------------------------------------------------------------
  // onTextContentClick
  // -------------------------------------------------------------------------
  describe('onTextContentClick', () => {
    const HREF = 'https://example.com/deep/link';

    it('returns without touching the event when there is no target', () => {
      const comp = makeComponent();
      const { event, preventDefault, stopPropagation } = clickEventOn(null);

      clickText(comp, event);

      expect(preventDefault).not.toHaveBeenCalled();
      expect(stopPropagation).not.toHaveBeenCalled();
      expect(openSpy).not.toHaveBeenCalled();
    });

    describe('link anchors', () => {
      it('suppresses the native navigation for a cometchat-link anchor', () => {
        const comp = makeComponent();
        const { event, preventDefault, stopPropagation } = clickEventOn(
          anchor('cometchat-link', HREF)
        );

        clickText(comp, event);

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(stopPropagation).toHaveBeenCalledTimes(1);
      });

      it('emits linkClick with the anchor href', () => {
        const comp = makeComponent();
        const emitted: string[] = [];
        comp.linkClick.subscribe(u => emitted.push(u));
        const { event } = clickEventOn(anchor('cometchat-link', HREF));

        clickText(comp, event);

        expect(emitted).toEqual([HREF]);
      });

      it('opens the anchor href in a new tab with noopener,noreferrer', () => {
        const comp = makeComponent();
        const { event } = clickEventOn(anchor('cometchat-link', HREF));

        clickText(comp, event);

        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(openSpy).toHaveBeenCalledWith(HREF, '_blank', 'noopener,noreferrer');
      });

      it('keeps the class alongside other classes', () => {
        const comp = makeComponent();
        const emitted: string[] = [];
        comp.linkClick.subscribe(u => emitted.push(u));
        const { event } = clickEventOn(anchor('some-other-class cometchat-link', HREF));

        clickText(comp, event);

        expect(emitted).toEqual([HREF]);
      });

      it('still suppresses the event for a cometchat-link anchor with no href', () => {
        const comp = makeComponent();
        const emitted: string[] = [];
        comp.linkClick.subscribe(u => emitted.push(u));
        const { event, preventDefault, stopPropagation } = clickEventOn(anchor('cometchat-link'));

        clickText(comp, event);

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(stopPropagation).toHaveBeenCalledTimes(1);
        expect(emitted).toEqual([]);
        expect(openSpy).not.toHaveBeenCalled();
      });

      it('treats an empty href as no href', () => {
        const comp = makeComponent();
        const emitted: string[] = [];
        comp.linkClick.subscribe(u => emitted.push(u));
        const { event } = clickEventOn(anchor('cometchat-link', ''));

        clickText(comp, event);

        expect(emitted).toEqual([]);
        expect(openSpy).not.toHaveBeenCalled();
      });

      it('ignores an anchor that lacks the cometchat-link class', () => {
        const comp = makeComponent();
        const emitted: string[] = [];
        comp.linkClick.subscribe(u => emitted.push(u));
        const { event, preventDefault } = clickEventOn(anchor('', HREF));

        clickText(comp, event);

        expect(emitted).toEqual([]);
        expect(openSpy).not.toHaveBeenCalled();
        expect(preventDefault).not.toHaveBeenCalled();
      });

      // The handler inspects event.target only — it never walks up to the
      // nearest anchor. A formatted link (markdown bold inside the anchor, an
      // emoji span) therefore delivers the CHILD as the target and no
      // linkClick is emitted. Pinning the current behaviour so a future
      // closest('a') fix shows up here as a deliberate change.
      it('does not emit when the click lands on a child of the link anchor', () => {
        const comp = makeComponent();
        const emitted: string[] = [];
        comp.linkClick.subscribe(u => emitted.push(u));
        const a = anchor('cometchat-link', HREF);
        const strong = document.createElement('strong');
        strong.textContent = 'click me';
        a.appendChild(strong);
        const { event, preventDefault } = clickEventOn(strong);

        clickText(comp, event);

        expect(emitted).toEqual([]);
        expect(openSpy).not.toHaveBeenCalled();
        expect(preventDefault).not.toHaveBeenCalled();
      });

      it('ignores a non-anchor element that merely carries the cometchat-link class', () => {
        const comp = makeComponent();
        const emitted: string[] = [];
        comp.linkClick.subscribe(u => emitted.push(u));
        const span = document.createElement('span');
        span.className = 'cometchat-link';
        span.setAttribute('href', HREF);
        const { event, preventDefault } = clickEventOn(span);

        clickText(comp, event);

        expect(emitted).toEqual([]);
        expect(openSpy).not.toHaveBeenCalled();
        expect(preventDefault).not.toHaveBeenCalled();
      });

      it('returns after the link branch instead of falling into the mention branch', () => {
        const comp = makeComponent();
        const user = makeUser('u-9');
        (comp as any).mentionedUsers = [user];
        const links: string[] = [];
        const mentions: CometChat.User[] = [];
        comp.linkClick.subscribe(u => links.push(u));
        comp.mentionClick.subscribe(u => mentions.push(u));
        const el = anchor('cometchat-link cometchat-mentions', HREF);
        el.setAttribute('data-uid', 'u-9');
        const { event } = clickEventOn(el);

        clickText(comp, event);

        expect(links).toEqual([HREF]);
        expect(mentions).toEqual([]);
      });
    });

    describe('mention elements', () => {
      it('suppresses the native event for a mention element', () => {
        const comp = makeComponent();
        const { event, preventDefault, stopPropagation } = clickEventOn(
          mentionSpan({ 'data-uid': 'u-1' })
        );

        clickText(comp, event);

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(stopPropagation).toHaveBeenCalledTimes(1);
      });

      it('emits mentionClick for the user matching data-uid', () => {
        const comp = makeComponent();
        const alice = makeUser('u-1', 'Alice');
        const bob = makeUser('u-2', 'Bob');
        (comp as any).mentionedUsers = [alice, bob];
        const emitted: CometChat.User[] = [];
        comp.mentionClick.subscribe(u => emitted.push(u));
        const { event } = clickEventOn(mentionSpan({ 'data-uid': 'u-2' }));

        clickText(comp, event);

        expect(emitted).toHaveLength(1);
        expect(emitted[0]).toBe(bob);
      });

      it('publishes a ccMouseEvent for the matched mention', () => {
        const comp = makeComponent();
        const alice = makeUser('u-1', 'Alice');
        (comp as any).mentionedUsers = [alice];
        const events = captureMouseEvents();
        const { event } = clickEventOn(mentionSpan({ 'data-uid': 'u-1' }));

        clickText(comp, event);

        expect(events).toHaveLength(1);
        expect((events[0] as any).body.CometChatUserGroupMembersObject).toBe(alice);
      });

      it('emits for a user mention type', () => {
        const comp = makeComponent();
        const alice = makeUser('u-1', 'Alice');
        (comp as any).mentionedUsers = [alice];
        const emitted: CometChat.User[] = [];
        comp.mentionClick.subscribe(u => emitted.push(u));
        const { event } = clickEventOn(
          mentionSpan({ 'data-uid': 'u-1', 'data-mention-type': 'user' })
        );

        clickText(comp, event);

        expect(emitted).toEqual([alice]);
      });

      it('ignores a channel mention even when its uid matches a known user', () => {
        const comp = makeComponent();
        const alice = makeUser('u-1', 'Alice');
        (comp as any).mentionedUsers = [alice];
        const emitted: CometChat.User[] = [];
        comp.mentionClick.subscribe(u => emitted.push(u));
        const { event, preventDefault } = clickEventOn(
          mentionSpan({ 'data-uid': 'u-1', 'data-mention-type': 'channel' })
        );

        clickText(comp, event);

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(emitted).toEqual([]);
      });

      it('ignores the @all mention', () => {
        const comp = makeComponent();
        (comp as any).mentionedUsers = [makeUser('all', 'Everyone')];
        const emitted: CometChat.User[] = [];
        comp.mentionClick.subscribe(u => emitted.push(u));
        const events = captureMouseEvents();
        const { event } = clickEventOn(mentionSpan({ 'data-uid': 'all' }));

        clickText(comp, event);

        expect(emitted).toEqual([]);
        expect(events).toEqual([]);
      });

      it('emits nothing when data-uid matches no mentioned user', () => {
        const comp = makeComponent();
        (comp as any).mentionedUsers = [makeUser('u-1', 'Alice')];
        const emitted: CometChat.User[] = [];
        comp.mentionClick.subscribe(u => emitted.push(u));
        const { event } = clickEventOn(mentionSpan({ 'data-uid': 'stranger' }));

        clickText(comp, event);

        expect(emitted).toEqual([]);
      });

      it('emits nothing when there are no mentioned users at all', () => {
        const comp = makeComponent();
        const emitted: CometChat.User[] = [];
        comp.mentionClick.subscribe(u => emitted.push(u));
        const events = captureMouseEvents();
        const { event } = clickEventOn(mentionSpan({ 'data-uid': 'u-1' }));

        clickText(comp, event);

        expect(emitted).toEqual([]);
        expect(events).toEqual([]);
      });

      it('emits nothing when the mention element has no data-uid', () => {
        const comp = makeComponent();
        (comp as any).mentionedUsers = [makeUser('u-1', 'Alice')];
        const emitted: CometChat.User[] = [];
        comp.mentionClick.subscribe(u => emitted.push(u));
        const { event, preventDefault } = clickEventOn(mentionSpan({}));

        clickText(comp, event);

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(emitted).toEqual([]);
      });
    });

    it('does nothing for an element in neither branch', () => {
      const comp = makeComponent();
      (comp as any).mentionedUsers = [makeUser('u-1', 'Alice')];
      const links: string[] = [];
      const mentions: CometChat.User[] = [];
      comp.linkClick.subscribe(u => links.push(u));
      comp.mentionClick.subscribe(u => mentions.push(u));
      const div = document.createElement('div');
      div.setAttribute('data-uid', 'u-1');
      const { event, preventDefault, stopPropagation } = clickEventOn(div);

      clickText(comp, event);

      expect(preventDefault).not.toHaveBeenCalled();
      expect(stopPropagation).not.toHaveBeenCalled();
      expect(links).toEqual([]);
      expect(mentions).toEqual([]);
      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // getDomainFromUrl
  // -------------------------------------------------------------------------
  describe('getDomainFromUrl', () => {
    function domain(comp: CometChatTextBubbleComponent, url: string): string {
      return (comp as unknown as { getDomainFromUrl(u: string): string }).getDomainFromUrl(url);
    }

    it('returns the hostname of a plain https url', () => {
      const comp = makeComponent();

      expect(domain(comp, 'https://www.example.com/a/b?c=1')).toBe('www.example.com');
    });

    it('drops the port from the hostname', () => {
      const comp = makeComponent();

      expect(domain(comp, 'http://sub.example.co.uk:8080/path')).toBe('sub.example.co.uk');
    });

    // Both inputs land in the same catch, so they belong in one test rather
    // than two that claim to cover different behaviour.
    it('returns an empty string when the url cannot be parsed', () => {
      const comp = makeComponent();

      expect(domain(comp, 'not a url at all')).toBe('');
      expect(domain(comp, '')).toBe('');
      expect(domain(comp, '//example.com/no-scheme')).toBe('');
    });
  });
});
