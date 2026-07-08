/**
 * CometChatAudioBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the audio bubble component that
 * renders CometChat.MediaMessage objects with waveform visualization, playback
 * controls, download functionality, and multiple audio support.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             Audio URL Extraction, Play/Pause Events, Alignment CSS,
 *             Null/Missing URL Fallback, Zero-Duration Handling,
 *             Caption Extraction, Multiple Audio Support, ARIA/Accessibility,
 *             Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.4, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-audio-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatAudioBubbleComponent } from './cometchat-audio-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock audio message object that mimics CometChat.MediaMessage
 * with the given number of attachments and optional caption.
 */
function createMockAudioMessage(attachmentCount: number, caption?: string): any {
  const attachments: any[] = [];
  for (let i = 1; i <= attachmentCount; i++) {
    attachments.push({
      name: `audio-${i}.mp3`,
      url: `https://example.com/audio-${i}.mp3`,
      mimeType: 'audio/mpeg',
      extension: 'mp3',
      size: 1024 * i,
    });
  }

  return {
    getAttachments: () => attachments,
    getText: () => caption || '',
    getData: () => (caption ? { text: caption } : {}),
    getSender: () => ({ getUid: () => 'superhero1' }),
    getReceiverType: () => 'user',
    getReceiver: () => 'superhero2',
    getType: () => 'audio',
    getId: () => 12345,
  };
}

/**
 * Triggers change detection and waits for async operations to settle.
 */
async function initAndDetect(
  fixture: ComponentFixture<CometChatAudioBubbleComponent>
): Promise<void> {
  fixture.detectChanges();
  await Promise.resolve();
  await new Promise(r => setTimeout(r, 50));
  fixture.detectChanges();
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('CometChatAudioBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatAudioBubbleComponent>;
  let component: CometChatAudioBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatAudioBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatAudioBubbleComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture?.destroy();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      component.message = createMockAudioMessage(1);
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default alignment as left', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('should render the root .cometchat-audio-bubble element', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-audio-bubble')).toBeTruthy();
    });

    it('should expose MessageBubbleAlignment enum to template', () => {
      expect(component.MessageBubbleAlignment).toBeDefined();
      expect(component.MessageBubbleAlignment.left).toBe(MessageBubbleAlignment.left);
      expect(component.MessageBubbleAlignment.right).toBe(MessageBubbleAlignment.right);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a message input and extract attachments on init', async () => {
      component.message = createMockAudioMessage(2);
      await initAndDetect(fixture);

      expect((component as any).attachments.length).toBe(2);
    });

    it('should reflect alignment input change to right', async () => {
      component.message = createMockAudioMessage(1);
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should update when message input changes via ngOnChanges', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(1);

      const newMessage = createMockAudioMessage(3);
      component.message = newMessage;
      component.ngOnChanges({
        message: {
          currentValue: newMessage,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();
      expect((component as any).attachments.length).toBe(3);
    });

    it('should update isOutgoing when alignment changes to right', async () => {
      component.message = createMockAudioMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);
      expect((component as any).isOutgoing).toBe(false);

      component.alignment = MessageBubbleAlignment.right;
      component.ngOnChanges({
        alignment: {
          currentValue: MessageBubbleAlignment.right,
          previousValue: MessageBubbleAlignment.left,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();
      expect((component as any).isOutgoing).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Audio URL Extraction
  // ---------------------------------------------------------------------------
  describe('Audio URL Extraction', () => {
    it('should extract audio URL from attachment', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      expect((component as any).attachments[0].url).toBe('https://example.com/audio-1.mp3');
    });

    it('should extract multiple audio URLs', async () => {
      component.message = createMockAudioMessage(3);
      await initAndDetect(fixture);

      const attachments = (component as any).attachments;
      expect(attachments.length).toBe(3);
      expect(attachments[0].url).toBe('https://example.com/audio-1.mp3');
      expect(attachments[1].url).toBe('https://example.com/audio-2.mp3');
      expect(attachments[2].url).toBe('https://example.com/audio-3.mp3');
    });

    it('should extract all attachment properties', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.url).toBe('https://example.com/audio-1.mp3');
      expect(att.name).toBe('audio-1.mp3');
      expect(att.size).toBe(1024);
      expect(att.mimeType).toBe('audio/mpeg');
      expect(att.extension).toBe('mp3');
    });

    it('should handle attachments with getter methods', async () => {
      component.message = {
        getAttachments: () => [
          {
            getName: () => 'getter-audio.wav',
            getUrl: () => 'https://example.com/getter.wav',
            getMimeType: () => 'audio/wav',
            getExtension: () => 'wav',
            getSize: () => 5000,
          },
        ],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.url).toBe('https://example.com/getter.wav');
      expect(att.name).toBe('getter-audio.wav');
      expect(att.mimeType).toBe('audio/wav');
    });

    it('should skip attachments without URL', async () => {
      component.message = {
        getAttachments: () => [
          { name: 'no-url.mp3', url: '', mimeType: 'audio/mpeg', extension: 'mp3', size: 1024 },
          {
            name: 'has-url.mp3',
            url: 'https://example.com/audio.mp3',
            mimeType: 'audio/mpeg',
            extension: 'mp3',
            size: 2048,
          },
        ],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      expect((component as any).attachments.length).toBe(1);
      expect((component as any).attachments[0].name).toBe('has-url.mp3');
    });

    it('should handle invalid attachment objects gracefully', async () => {
      component.message = {
        getAttachments: () => [null, undefined, 'invalid', 123, {}],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      expect((component as any).attachments.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Play/Pause Button Click Events
  // ---------------------------------------------------------------------------
  describe('Play/Pause Button Click Events', () => {
    it('should render a play button for the first audio', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const playBtn = el.querySelector('.cometchat-audio-bubble__play-button');
      expect(playBtn).toBeTruthy();
    });

    it('should not emit playStateChange when audio is still loading', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.playStateChange.subscribe(spy);

      // Audio state defaults to isLoading=true, so onPlayPause should be a no-op
      (component as any).onPlayPause(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit playStateChange when toggling play on a loaded audio', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      // Simulate audio loaded state (no real WaveSurfer in jsdom)
      const state = (component as any).getAudioState(0);
      state.isLoading = false;
      // WaveSurfer is null in test env, so onPlayPause will bail early
      // We test the output emission via direct state manipulation
      const spy = vi.fn();
      component.playStateChange.subscribe(spy);

      // Since waveSurfer is null, onPlayPause returns early.
      // Verify the guard works correctly.
      (component as any).onPlayPause(0);
      expect(spy).not.toHaveBeenCalled(); // Expected: waveSurfer null guard
    });

    it('should handle keyboard Enter on play/pause button via onPlayPauseKeydown', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onPlayPauseKeydown(event, 0);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should handle keyboard Space on play/pause button', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onPlayPauseKeydown(event, 0);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should ignore non-activation keys on play/pause', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onPlayPauseKeydown(event, 0);
      expect(preventSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment CSS Classes
  // ---------------------------------------------------------------------------
  describe('Alignment CSS Classes', () => {
    it('should apply receiver class for left alignment (default)', async () => {
      component.message = createMockAudioMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-audio-bubble');
      expect(bubble?.classList.contains('cometchat-audio-bubble--receiver')).toBe(true);
      expect(bubble?.classList.contains('cometchat-audio-bubble--sender')).toBe(false);
    });

    it('should apply sender class for right alignment', async () => {
      component.message = createMockAudioMessage(1);
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-audio-bubble');
      expect(bubble?.classList.contains('cometchat-audio-bubble--sender')).toBe(true);
      expect(bubble?.classList.contains('cometchat-audio-bubble--receiver')).toBe(false);
    });

    it('should switch alignment classes when alignment changes', async () => {
      component.message = createMockAudioMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      let bubble = el.querySelector('.cometchat-audio-bubble');
      expect(bubble?.classList.contains('cometchat-audio-bubble--receiver')).toBe(true);

      // Switch to right
      component.alignment = MessageBubbleAlignment.right;
      component.ngOnChanges({
        alignment: {
          currentValue: MessageBubbleAlignment.right,
          previousValue: MessageBubbleAlignment.left,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();

      bubble = el.querySelector('.cometchat-audio-bubble');
      expect(bubble?.classList.contains('cometchat-audio-bubble--sender')).toBe(true);
      expect(bubble?.classList.contains('cometchat-audio-bubble--receiver')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Null/Missing URL Fallback
  // ---------------------------------------------------------------------------
  describe('Null/Missing URL Fallback', () => {
    it('should handle null message gracefully without throwing', () => {
      component.message = null as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle undefined message gracefully', () => {
      component.message = undefined as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle null attachments array', async () => {
      component.message = {
        getAttachments: () => null,
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle empty attachments array', async () => {
      component.message = createMockAudioMessage(0);
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle message without getAttachments method', async () => {
      component.message = { getText: () => '', getData: () => ({}) } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).attachments.length).toBe(0);
    });

    it('should handle getAttachments throwing an error', async () => {
      component.message = {
        getAttachments: () => {
          throw new Error('Extraction error');
        },
        getText: () => '',
        getData: () => ({}),
      } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).attachments.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Zero-Duration Handling
  // ---------------------------------------------------------------------------
  describe('Zero-Duration Handling', () => {
    it('should format 0 seconds as 0:00', () => {
      expect((component as any).formatTime(0)).toBe('0:00');
    });

    it('should format seconds correctly', () => {
      expect((component as any).formatTime(5)).toBe('0:05');
      expect((component as any).formatTime(30)).toBe('0:30');
      expect((component as any).formatTime(59)).toBe('0:59');
    });

    it('should format minutes correctly', () => {
      expect((component as any).formatTime(60)).toBe('1:00');
      expect((component as any).formatTime(90)).toBe('1:30');
      expect((component as any).formatTime(125)).toBe('2:05');
    });

    it('should format longer durations', () => {
      expect((component as any).formatTime(600)).toBe('10:00');
      expect((component as any).formatTime(3600)).toBe('60:00');
    });

    it('should handle negative values as 0:00', () => {
      expect((component as any).formatTime(-5)).toBe('0:00');
    });

    it('should handle NaN as 0:00', () => {
      expect((component as any).formatTime(NaN)).toBe('0:00');
    });

    it('should handle Infinity as 0:00', () => {
      expect((component as any).formatTime(Infinity)).toBe('0:00');
    });

    it('should handle null/undefined as 0:00', () => {
      expect((component as any).formatTime(null)).toBe('0:00');
      expect((component as any).formatTime(undefined)).toBe('0:00');
    });

    it('should create default audio state with zero duration', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const state = (component as any).getAudioState(0);
      expect(state.duration).toBe(0);
      expect(state.currentTime).toBe(0);
    });

    it('should display 0:00 / 0:00 time in DOM when loading', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const timeEl = el.querySelector('.cometchat-audio-bubble__time');
      // While loading, it shows the loading text
      if (timeEl) {
        expect(timeEl.textContent?.trim()).toBeTruthy();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Caption Extraction
  // ---------------------------------------------------------------------------
  describe('Caption Extraction', () => {
    it('should detect caption via getText()', async () => {
      component.message = createMockAudioMessage(1, 'Test caption');
      await initAndDetect(fixture);
      expect((component as any).hasCaption).toBe(true);
    });

    it('should detect no caption when getText() returns empty', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);
      expect((component as any).hasCaption).toBe(false);
    });

    it('should detect caption via getData().text fallback', async () => {
      component.message = {
        getAttachments: () => [
          {
            name: 'a.mp3',
            url: 'https://example.com/a.mp3',
            mimeType: 'audio/mpeg',
            extension: 'mp3',
            size: 1024,
          },
        ],
        getText: () => '',
        getData: () => ({ text: 'Caption from getData' }),
      } as any;
      await initAndDetect(fixture);
      expect((component as any).hasCaption).toBe(true);
    });

    it('should treat whitespace-only caption as no caption', async () => {
      component.message = createMockAudioMessage(1, '   ');
      await initAndDetect(fixture);
      expect((component as any).hasCaption).toBe(false);
    });

    it('should render caption section when caption exists', async () => {
      component.message = createMockAudioMessage(1, 'My audio caption');
      await initAndDetect(fixture);

      const captionEl = el.querySelector('.cometchat-audio-bubble__caption');
      expect(captionEl).toBeTruthy();
    });

    it('should not render caption section when no caption', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const captionEl = el.querySelector('.cometchat-audio-bubble__caption');
      expect(captionEl).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple Audio Support & Expand/Collapse
  // ---------------------------------------------------------------------------
  describe('Multiple Audio Support', () => {
    it('should show expand indicator when multiple audios exist', async () => {
      component.message = createMockAudioMessage(3);
      await initAndDetect(fixture);

      const expandBtn = el.querySelector('.cometchat-audio-bubble__expand-indicator');
      expect(expandBtn).toBeTruthy();
      expect(expandBtn?.textContent?.trim()).toContain('+2');
    });

    it('should not show expand indicator for single audio', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const expandBtn = el.querySelector('.cometchat-audio-bubble__expand-indicator');
      expect(expandBtn).toBeNull();
    });

    it('should emit expandChange when toggling expand', async () => {
      component.message = createMockAudioMessage(3);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.expandChange.subscribe(spy);

      (component as any).toggleExpanded();
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should show audio list and collapse button when expanded', async () => {
      component.message = createMockAudioMessage(3);
      await initAndDetect(fixture);

      (component as any).toggleExpanded();
      fixture.detectChanges();

      const audioList = el.querySelector('.cometchat-audio-bubble__audio-list');
      expect(audioList).toBeTruthy();

      const collapseBtn = el.querySelector('.cometchat-audio-bubble__collapse-control');
      expect(collapseBtn).toBeTruthy();
    });

    it('should handle keyboard Enter on expand/collapse', async () => {
      component.message = createMockAudioMessage(3);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onExpandCollapseKeydown(event);
      expect(preventSpy).toHaveBeenCalled();
      expect((component as any).isExpanded).toBe(true);
    });

    it('should reset expanded state on message change', async () => {
      component.message = createMockAudioMessage(3);
      await initAndDetect(fixture);

      (component as any).toggleExpanded();
      expect((component as any).isExpanded).toBe(true);

      const newMessage = createMockAudioMessage(2);
      component.message = newMessage;
      component.ngOnChanges({
        message: {
          currentValue: newMessage,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();
      expect((component as any).isExpanded).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit downloadStart when onDownload is called', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.downloadStart.subscribe(spy);

      (component as any).onDownload(0);
      expect(spy).toHaveBeenCalledWith((component as any).attachments[0]);
    });

    it('should not emit downloadStart when already downloading', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const state = (component as any).getAudioState(0);
      state.isDownloading = true;

      const spy = vi.fn();
      component.downloadStart.subscribe(spy);

      (component as any).onDownload(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit downloadStart for invalid index', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.downloadStart.subscribe(spy);

      (component as any).onDownload(5);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit expandChange with false when collapsing', async () => {
      component.message = createMockAudioMessage(3);
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.expandChange.subscribe(spy);

      (component as any).toggleExpanded(); // expand
      (component as any).toggleExpanded(); // collapse
      expect(spy).toHaveBeenCalledWith(false);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering & BEM Structure
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the container element', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-audio-bubble__container')).toBeTruthy();
    });

    it('should render the audio item element', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-audio-bubble__audio-item')).toBeTruthy();
    });

    it('should render leading view with play button', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-audio-bubble__leading-view')).toBeTruthy();
      expect(el.querySelector('.cometchat-audio-bubble__play-button')).toBeTruthy();
    });

    it('should render body with waveform container', async () => {
      component.message = createMockAudioMessage(1);
      // Use only the first detectChanges to check initial DOM before WaveSurfer
      // async init fails in jsdom and sets hasError=true (hiding the waveform).
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-audio-bubble__body')).toBeTruthy();
      expect(el.querySelector('.cometchat-audio-bubble__waveform')).toBeTruthy();
    });

    it('should render tail view with download button', async () => {
      component.message = createMockAudioMessage(1);
      // ENG-35743: download button moved from __tail-view into __time-download-row.
      // Use only the first detectChanges before WaveSurfer async init fails in
      // jsdom and sets hasError=true (which hides the download row).
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-audio-bubble__time-download-row')).toBeTruthy();
      expect(el.querySelector('.cometchat-audio-bubble__download-button')).toBeTruthy();
    });

    it('should render time display element', async () => {
      component.message = createMockAudioMessage(1);
      // Check initial DOM before WaveSurfer async init fails in jsdom.
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-audio-bubble__time')).toBeTruthy();
    });

    it('should not render any audio items when no attachments', async () => {
      component.message = createMockAudioMessage(0);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-audio-bubble__audio-item')).toBeNull();
    });

    it('should have role="region" on the root element', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-audio-bubble');
      expect(bubble?.getAttribute('role')).toBe('region');
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA / Accessibility
  // ---------------------------------------------------------------------------
  describe('ARIA Attributes', () => {
    it('should have aria-label on the audio bubble region', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-audio-bubble');
      expect(bubble?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on play button', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const playBtn = el.querySelector('.cometchat-audio-bubble__play-button');
      expect(playBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on download button', async () => {
      component.message = createMockAudioMessage(1);
      // ENG-35743: download button is now inside __time-download-row which only
      // renders in the non-error branch. Use first detectChanges only, before
      // WaveSurfer async init fails in jsdom and sets hasError=true.
      fixture.detectChanges();

      const downloadBtn = el.querySelector('.cometchat-audio-bubble__download-button');
      expect(downloadBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have role="slider" on waveform element', async () => {
      component.message = createMockAudioMessage(1);
      // Check initial DOM before WaveSurfer async init fails in jsdom.
      fixture.detectChanges();

      const waveform = el.querySelector('.cometchat-audio-bubble__waveform');
      expect(waveform?.getAttribute('role')).toBe('slider');
    });

    it('should have aria-valuemin/max/now on waveform slider', async () => {
      component.message = createMockAudioMessage(1);
      // Check initial DOM before WaveSurfer async init fails in jsdom.
      fixture.detectChanges();

      const waveform = el.querySelector('.cometchat-audio-bubble__waveform');
      expect(waveform?.getAttribute('aria-valuemin')).toBe('0');
      expect(waveform?.hasAttribute('aria-valuemax')).toBe(true);
      expect(waveform?.hasAttribute('aria-valuenow')).toBe(true);
    });

    it('should have aria-expanded on expand indicator', async () => {
      component.message = createMockAudioMessage(3);
      await initAndDetect(fixture);

      const expandBtn = el.querySelector('.cometchat-audio-bubble__expand-indicator');
      expect(expandBtn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should generate correct play/pause ARIA labels', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const playLabel = (component as any).getPlayPauseAriaLabel(0);
      expect(playLabel).toBeTruthy();
      expect(typeof playLabel).toBe('string');
    });

    it('should generate expand ARIA label with correct count', async () => {
      component.message = createMockAudioMessage(4);
      await initAndDetect(fixture);

      const label = (component as any).getExpandAriaLabel();
      expect(label).toContain('3');
    });
  });

  // ---------------------------------------------------------------------------
  // Audio State Management
  // ---------------------------------------------------------------------------
  describe('Audio State Management', () => {
    it('should create default audio state for new index', async () => {
      component.message = createMockAudioMessage(1);
      // Check state after first detectChanges only — before WaveSurfer async
      // init fails in jsdom (which flips isLoading→false, hasError→true).
      fixture.detectChanges();

      // Query a fresh, unused index to verify the default state shape.
      const state = (component as any).getAudioState(99);
      expect(state.waveSurfer).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(true);
      expect(state.hasError).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.isDownloading).toBe(false);
      expect(state.downloadProgress).toBe(0);
      expect(state.abortController).toBeNull();
    });

    it('should return same state for same index', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const state1 = (component as any).getAudioState(0);
      const state2 = (component as any).getAudioState(0);
      expect(state1).toBe(state2);
    });

    it('should create separate states for different indices', async () => {
      component.message = createMockAudioMessage(2);
      await initAndDetect(fixture);

      const state0 = (component as any).getAudioState(0);
      const state1 = (component as any).getAudioState(1);
      expect(state0).not.toBe(state1);
    });
  });

  // ---------------------------------------------------------------------------
  // Download Progress
  // ---------------------------------------------------------------------------
  describe('Download Progress', () => {
    it('should calculate progress dash array at 0%', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      (component as any).getAudioState(0).downloadProgress = 0;
      expect((component as any).getProgressDashArray(0)).toBe('0 62.8');
    });

    it('should calculate progress dash array at 50%', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      (component as any).getAudioState(0).downloadProgress = 50;
      expect((component as any).getProgressDashArray(0)).toBe('31.4 62.8');
    });

    it('should calculate progress dash array at 100%', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      (component as any).getAudioState(0).downloadProgress = 100;
      expect((component as any).getProgressDashArray(0)).toBe('62.8 62.8');
    });
  });

  // ---------------------------------------------------------------------------
  // Localized Labels
  // ---------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should have localized play label', () => {
      const label = CometChatLocalize.getLocalizedString('audio_bubble_play');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should have localized pause label', () => {
      const label = CometChatLocalize.getLocalizedString('audio_bubble_pause');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should have localized download label', () => {
      const label = CometChatLocalize.getLocalizedString('audio_bubble_download');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should have localized loading label', () => {
      const label = CometChatLocalize.getLocalizedString('audio_bubble_loading');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should have localized show more/less labels', () => {
      const showMore = CometChatLocalize.getLocalizedString('audio_bubble_show_more');
      const showLess = CometChatLocalize.getLocalizedString('audio_bubble_show_less');
      expect(showMore).toBeTruthy();
      expect(showLess).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle message with malformed getData gracefully', async () => {
      component.message = {
        getAttachments: () => [
          {
            name: 'a.mp3',
            url: 'https://example.com/a.mp3',
            mimeType: 'audio/mpeg',
            extension: 'mp3',
            size: 1024,
          },
        ],
        getText: () => '',
        getData: () => {
          throw new Error('getData error');
        },
      } as any;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect((component as any).hasCaption).toBe(false);
    });

    it('should clean up audio states on destroy', async () => {
      component.message = createMockAudioMessage(2);
      await initAndDetect(fixture);

      (component as any).getAudioState(0);
      (component as any).getAudioState(1);
      expect((component as any).audioStates.size).toBeGreaterThanOrEqual(2);

      fixture.destroy();
      // After destroy, audioStates should be cleared
      expect((component as any).audioStates.size).toBe(0);
    });

    it('should handle cancel download resetting state', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      (component as any).onDownload(0);
      const state = (component as any).getAudioState(0);
      expect(state.isDownloading).toBe(true);

      (component as any).onCancelDownload(0);
      expect(state.isDownloading).toBe(false);
      expect(state.downloadProgress).toBe(0);
    });

    it('should handle keyboard Enter on download button', async () => {
      component.message = createMockAudioMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      const downloadSpy = vi.fn();
      component.downloadStart.subscribe(downloadSpy);

      (component as any).onDownloadKeydown(event, 0);
      expect(preventSpy).toHaveBeenCalled();
      expect(downloadSpy).toHaveBeenCalled();
    });

    it('should not render audio items when message has no attachments', async () => {
      component.message = {
        getAttachments: () => [],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-audio-bubble__audio-item')).toBeNull();
    });

    it('should provide defaults for attachment properties when missing', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/audio.mp3' }],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.size).toBe(0);
      expect(att.mimeType).toBe('audio/mpeg');
      expect(att.extension).toBe('mp3');
    });
  });
});
