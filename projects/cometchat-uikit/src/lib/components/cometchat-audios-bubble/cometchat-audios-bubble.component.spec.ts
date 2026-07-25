import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CometChatAudiosBubbleComponent } from './cometchat-audios-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

function fakeAudio(): HTMLAudioElement {
  return {
    paused: true,
    play: vi.fn(function (this: { paused: boolean }) {
      this.paused = false;
    }),
    pause: vi.fn(function (this: { paused: boolean }) {
      this.paused = true;
    }),
  } as unknown as HTMLAudioElement;
}

describe('CometChatAudiosBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatAudiosBubbleComponent>;
  let comp: CometChatAudiosBubbleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatAudiosBubbleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatAudiosBubbleComponent);
    comp = fixture.componentInstance;
  });

  // Zero-padded minutes, per the design reference ("00:00/00:32").
  it('formats time as mm:ss with zero-padded minutes', () => {
    expect(comp.formatTime(0)).toBe('00:00');
    expect(comp.formatTime(5)).toBe('00:05');
    expect(comp.formatTime(32)).toBe('00:32');
    expect(comp.formatTime(65)).toBe('01:05');
    expect(comp.formatTime(600)).toBe('10:00');
  });

  it('formatTime clamps bad input to 00:00', () => {
    expect(comp.formatTime(NaN)).toBe('00:00');
    expect(comp.formatTime(-5)).toBe('00:00');
    expect(comp.formatTime(Infinity)).toBe('00:00');
  });

  it('renders a row per audio attachment (icon + slider + name)', () => {
    (comp as unknown as { attachments: unknown[] }).attachments = [
      { url: 'a.mp3', name: 'A.mp3', size: 1, mimeType: 'audio/mpeg', extension: 'mp3', duration: 30 },
    ];
    (comp as unknown as { states: unknown[] }).states = [
      { currentTime: 0, duration: 30, playing: false },
    ];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.cometchat-audios-bubble__item').length).toBe(1);
    expect(el.querySelector('.cometchat-audios-bubble__slider')).toBeTruthy();
    expect(
      el.querySelector('.cometchat-audios-bubble__name')?.textContent?.trim(),
    ).toBe('A.mp3');
  });

  it('togglePlay plays a row and pauses any previously-playing row', () => {
    (comp as unknown as { attachments: unknown[] }).attachments = [
      { url: 'a', name: 'a' },
      { url: 'b', name: 'b' },
    ];
    (comp as unknown as { states: { playing: boolean }[] }).states = [
      { currentTime: 0, duration: 10, playing: false },
      { currentTime: 0, duration: 10, playing: false },
    ];
    const elA = fakeAudio();
    const elB = fakeAudio();
    const states = (comp as unknown as { states: { playing: boolean }[] }).states;

    comp.togglePlay(0, elA);
    expect(states[0].playing).toBe(true);

    comp.togglePlay(1, elB);
    expect(states[0].playing).toBe(false); // A paused
    expect(states[1].playing).toBe(true);

    comp.togglePlay(1, elB);
    expect(states[1].playing).toBe(false);
  });

  // ── Overflow / download / grouping (React parity) ────────────────────────
  /**
   * Seed the component's state and render ONCE. The component is OnPush, so fields written after
   * the first detectChanges() would not re-render — everything must be set up front.
   */
  function seedRows(count: number, caption = ''): void {
    (comp as unknown as { attachments: unknown[] }).attachments = Array.from(
      { length: count },
      (_, i) => ({
        url: `a${String(i)}.mp3`,
        name: `A${String(i)}.mp3`,
        size: 1,
        mimeType: 'audio/mpeg',
        extension: 'mp3',
        duration: 30,
      }),
    );
    (comp as unknown as { states: unknown[] }).states = Array.from({ length: count }, () => ({
      currentTime: 0,
      duration: 30,
      playing: false,
    }));
    (comp as unknown as { captionText: string }).captionText = caption;
    fixture.detectChanges();
  }

  it('shows the first three rows and a "Show N more" toggle beyond that', () => {
    seedRows(5);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.cometchat-audios-bubble__item').length).toBe(3);
    const toggle = el.querySelector('.cometchat-audios-bubble__toggle');
    expect(toggle).toBeTruthy();
    expect(toggle?.textContent?.trim()).toBe('Show 2 more');
    // A down-chevron precedes the label.
    expect(toggle?.querySelector('.cometchat-audios-bubble__toggle-icon')).toBeTruthy();
  });

  it('does not collapse at exactly three rows', () => {
    seedRows(3);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.cometchat-audios-bubble__item').length).toBe(3);
    expect(el.querySelector('.cometchat-audios-bubble__toggle')).toBeNull();
  });

  it('expands to every row and swaps the toggle to "Show less"', () => {
    seedRows(5);
    (comp as unknown as { toggleExpanded(): void }).toggleExpanded();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.cometchat-audios-bubble__item').length).toBe(5);
    const toggle = el.querySelector('.cometchat-audios-bubble__toggle');
    expect(toggle?.textContent?.trim()).toBe('Show less');
    // ...and the chevron flips from down to up.
    const icon = toggle?.querySelector('.cometchat-audios-bubble__toggle-icon') as HTMLElement;
    expect(icon.style.maskImage).toContain('keyboard_arrow_up.svg');
  });

  it('keeps the collapsed slice a prefix, so row index still indexes `states`', () => {
    seedRows(5);
    const visible = (comp as unknown as { visibleAttachments: { name: string }[] })
      .visibleAttachments;
    expect(visible.map((a) => a.name)).toEqual(['A0.mp3', 'A1.mp3', 'A2.mp3']);
  });

  it('renders a download button per row', () => {
    seedRows(2);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.cometchat-audios-bubble__download').length).toBe(2);
  });

  it('applies the --multi container modifier for more than one row', () => {
    seedRows(2);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cometchat-audios-bubble__container--multi')).toBeTruthy();
  });

  it('does NOT apply the --multi modifier for a single row', () => {
    seedRows(1);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cometchat-audios-bubble__container--multi')).toBeNull();
  });

  it('renders the caption through cometchat-text-bubble, not as bare text', () => {
    seedRows(1, 'hello @someone');
    const el = fixture.nativeElement as HTMLElement;
    const caption = el.querySelector('.cometchat-audios-bubble__caption');
    expect(caption).toBeTruthy();
    expect(caption?.querySelector('cometchat-text-bubble')).toBeTruthy();
  });

  // ── Row layout (design reference) ────────────────────────────────────────
  it('renders no file-type icon before the filename', () => {
    seedRows(1);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cometchat-audios-bubble__type-icon')).toBeNull();
    expect(el.querySelector('.cometchat-audios-bubble__header')).toBeNull();
  });

  it('stacks name → seek bar → time inside the body, in that order', () => {
    seedRows(1);
    const el = fixture.nativeElement as HTMLElement;
    const body = el.querySelector('.cometchat-audios-bubble__body');
    expect(body).toBeTruthy();

    const order = Array.from(body!.children).map((c) => c.className.split(' ')[0]);
    expect(order).toEqual([
      'cometchat-audios-bubble__name',
      'cometchat-audios-bubble__slider',
      'cometchat-audios-bubble__duration',
    ]);
  });

  it('shows the elapsed/total time below the bar as mm:ss/mm:ss', () => {
    seedRows(1);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cometchat-audios-bubble__duration')?.textContent?.trim()).toBe(
      '00:00/00:30',
    );
  });

  it('marks the outgoing bubble with --sender so the inverted palette applies', () => {
    (comp as unknown as { alignment: unknown }).alignment = MessageBubbleAlignment.right;
    seedRows(1);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cometchat-audios-bubble--sender')).toBeTruthy();
  });

  it('leaves the incoming bubble unmarked', () => {
    (comp as unknown as { alignment: unknown }).alignment = MessageBubbleAlignment.left;
    seedRows(1);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cometchat-audios-bubble--sender')).toBeNull();
  });
});
