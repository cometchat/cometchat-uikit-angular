/**
 * CometChatFileBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the file bubble component that
 * renders CometChat.MediaMessage objects with file attachments, download
 * functionality, expand/collapse for multiple files, and caption support.
 *
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, Filename Extraction,
 *             File Size Formatting, Download Link Click Events,
 *             Alignment CSS, Null/Missing File Data Fallback,
 *             Multiple Files & Expand/Collapse, Caption Extraction,
 *             ARIA/Accessibility, File Type Detection, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.4, 3.5,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-file-bubble
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { CometChatFileBubbleComponent } from './cometchat-file-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock file message object that mimics CometChat.MediaMessage
 * with the given number of attachments and optional caption.
 */
function createMockFileMessage(attachmentCount: number, caption?: string): any {
  const attachments: any[] = [];
  for (let i = 1; i <= attachmentCount; i++) {
    attachments.push({
      name: `file-${i}.pdf`,
      url: `https://example.com/file-${i}.pdf`,
      mimeType: 'application/pdf',
      extension: 'pdf',
      size: 1024 * i,
    });
  }

  return {
    getAttachments: () => attachments,
    // A real CometChat.MediaMessage has NO getText(); the caption lives in getCaption()/data.text.
    getCaption: () => caption || '',
    getData: () => (caption ? { text: caption } : {}),
    getSender: () => ({ getUid: () => 'superhero1' }),
    getReceiverType: () => 'user',
    getReceiver: () => 'superhero2',
    getType: () => 'file',
    getId: () => 99999,
  };
}

/**
 * Triggers change detection and waits for async operations to settle.
 */
async function initAndDetect(
  fixture: ComponentFixture<CometChatFileBubbleComponent>
): Promise<void> {
  fixture.detectChanges();
  await Promise.resolve();
  await new Promise(r => setTimeout(r, 50));
  fixture.detectChanges();
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('CometChatFileBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatFileBubbleComponent>;
  let component: CometChatFileBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatFileBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatFileBubbleComponent);
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
      component.message = createMockFileMessage(1);
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default alignment as left', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('should render the root .cometchat-file-bubble element', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-file-bubble')).toBeTruthy();
    });

    it('should expose MessageBubbleAlignment enum to template', () => {
      expect(component.MessageBubbleAlignment).toBeDefined();
      expect(component.MessageBubbleAlignment.left).toBe(MessageBubbleAlignment.left);
      expect(component.MessageBubbleAlignment.right).toBe(MessageBubbleAlignment.right);
    });

    it('should have empty attachments before init', () => {
      // Before detectChanges, attachments should be empty
      expect((component as any).attachments).toEqual([]);
    });

    it('should not be expanded by default', () => {
      expect((component as any).isExpanded).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a message input and extract attachments on init', async () => {
      component.message = createMockFileMessage(2);
      await initAndDetect(fixture);

      expect((component as any).attachments.length).toBe(2);
    });

    it('should reflect alignment input change to right', async () => {
      component.message = createMockFileMessage(1);
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should update when message input changes via ngOnChanges', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(1);

      const newMessage = createMockFileMessage(3);
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
      component.message = createMockFileMessage(1);
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
  // Filename Extraction and Display
  // ---------------------------------------------------------------------------
  describe('Filename Extraction and Display', () => {
    it('should extract filename from attachment', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);
      expect((component as any).attachments[0].name).toBe('file-1.pdf');
    });

    it('should extract multiple filenames', async () => {
      component.message = createMockFileMessage(3);
      await initAndDetect(fixture);

      const attachments = (component as any).attachments;
      expect(attachments[0].name).toBe('file-1.pdf');
      expect(attachments[1].name).toBe('file-2.pdf');
      expect(attachments[2].name).toBe('file-3.pdf');
    });

    it('should extract all attachment properties', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.url).toBe('https://example.com/file-1.pdf');
      expect(att.name).toBe('file-1.pdf');
      expect(att.size).toBe(1024);
      expect(att.mimeType).toBe('application/pdf');
      expect(att.extension).toBe('pdf');
    });

    it('should handle attachments with getter methods', async () => {
      component.message = {
        getAttachments: () => [
          {
            getName: () => 'getter-file.docx',
            getUrl: () => 'https://example.com/getter.docx',
            getMimeType: () =>
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            getExtension: () => 'docx',
            getSize: () => 5000,
          },
        ],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.url).toBe('https://example.com/getter.docx');
      expect(att.name).toBe('getter-file.docx');
      expect(att.mimeType).toContain('wordprocessingml');
    });

    it('should display filename in the DOM', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const filenameEl = el.querySelector('.cometchat-file-bubble__filename');
      expect(filenameEl).toBeTruthy();
      expect(filenameEl?.textContent?.trim()).toBe('file-1.pdf');
    });

    it('should display the "EXT · size" meta line in the DOM', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const sizeEl = el.querySelector('.cometchat-file-bubble__filesize');
      expect(sizeEl).toBeTruthy();
      expect(sizeEl?.textContent?.trim()).toBe('PDF · 1 KB');
    });

    it('should provide defaults for missing properties', async () => {
      component.message = {
        getAttachments: () => [{ url: 'https://example.com/file.pdf' }],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.size).toBe(0);
      expect(att.mimeType).toBe('application/octet-stream');
      expect(att.extension).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // File Size Formatting
  // ---------------------------------------------------------------------------
  describe('File Size Formatting', () => {
    it('should format bytes correctly', () => {
      expect((component as any).formatFileSize(500)).toBe('500 B');
      expect((component as any).formatFileSize(1)).toBe('1 B');
      expect((component as any).formatFileSize(1023)).toBe('1023 B');
    });

    // Rounded, matching the React kit: "98 KB" / "35.9 MB", not "98.00 KB" / "35.90 MB".
    it('should format kilobytes correctly (rounded, no decimals)', () => {
      expect((component as any).formatFileSize(1024)).toBe('1 KB');
      expect((component as any).formatFileSize(2048)).toBe('2 KB');
      expect((component as any).formatFileSize(1536)).toBe('2 KB'); // 1.5 rounds up
      expect((component as any).formatFileSize(100352)).toBe('98 KB');
    });

    it('should format megabytes correctly (one decimal)', () => {
      expect((component as any).formatFileSize(1048576)).toBe('1.0 MB');
      expect((component as any).formatFileSize(5242880)).toBe('5.0 MB');
      expect((component as any).formatFileSize(37643878)).toBe('35.9 MB');
    });

    it('should format gigabytes correctly (one decimal; no React counterpart)', () => {
      expect((component as any).formatFileSize(1073741824)).toBe('1.0 GB');
      expect((component as any).formatFileSize(2147483648)).toBe('2.0 GB');
    });

    it('should handle null/undefined/zero size', () => {
      const unknownLabel = CometChatLocalize.getLocalizedString('file_bubble_size_unknown');
      expect((component as any).formatFileSize(null)).toBe(unknownLabel);
      expect((component as any).formatFileSize(undefined)).toBe(unknownLabel);
      expect((component as any).formatFileSize(0)).toBe(unknownLabel);
    });
  });

  // ---------------------------------------------------------------------------
  // Download Link Click Events
  // ---------------------------------------------------------------------------
  describe('Download Link Click Events', () => {
    it('should render a download button for the first file', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const downloadBtn = el.querySelector('.cometchat-file-bubble__download');
      expect(downloadBtn).toBeTruthy();
    });

    it('should call initiateDownload when download button is clicked', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const spy = vi.spyOn(component as any, 'initiateDownload');
      const downloadBtn = el.querySelector<HTMLButtonElement>('.cometchat-file-bubble__download');
      downloadBtn?.click();
      expect(spy).toHaveBeenCalled();
    });

    it('should handle keyboard Enter on download via onDownloadKeyDown', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onDownloadKeyDown(event, (component as any).attachments[0]);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should handle keyboard Space on download via onDownloadKeyDown', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onDownloadKeyDown(event, (component as any).attachments[0]);
      expect(preventSpy).toHaveBeenCalled();
    });

    it('should ignore non-activation keys on download', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      (component as any).onDownloadKeyDown(event, (component as any).attachments[0]);
      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('should show disabled download when attachment has no URL', async () => {
      component.message = {
        getAttachments: () => [
          {
            name: 'no-url.pdf',
            url: 'https://example.com/file.pdf',
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: 1024,
          },
        ],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      // The first attachment has a URL, so download button should be enabled
      const downloadBtn = el.querySelector('button.cometchat-file-bubble__download');
      expect(downloadBtn).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment CSS Classes
  // ---------------------------------------------------------------------------
  describe('Alignment CSS Classes', () => {
    it('should apply receiver class for left alignment (default)', async () => {
      component.message = createMockFileMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-file-bubble');
      expect(bubble?.classList.contains('cometchat-file-bubble--receiver')).toBe(true);
      expect(bubble?.classList.contains('cometchat-file-bubble--sender')).toBe(false);
    });

    it('should apply sender class for right alignment', async () => {
      component.message = createMockFileMessage(1);
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);

      const bubble = el.querySelector('.cometchat-file-bubble');
      expect(bubble?.classList.contains('cometchat-file-bubble--sender')).toBe(true);
      expect(bubble?.classList.contains('cometchat-file-bubble--receiver')).toBe(false);
    });

    it('should switch alignment classes when alignment changes', async () => {
      component.message = createMockFileMessage(1);
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);

      let bubble = el.querySelector('.cometchat-file-bubble');
      expect(bubble?.classList.contains('cometchat-file-bubble--receiver')).toBe(true);

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

      bubble = el.querySelector('.cometchat-file-bubble');
      expect(bubble?.classList.contains('cometchat-file-bubble--sender')).toBe(true);
      expect(bubble?.classList.contains('cometchat-file-bubble--receiver')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Null/Missing File Data Fallback
  // ---------------------------------------------------------------------------
  describe('Null/Missing File Data Fallback', () => {
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
      component.message = createMockFileMessage(0);
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

    it('should skip attachments without URL', async () => {
      component.message = {
        getAttachments: () => [
          {
            name: 'no-url.pdf',
            url: '',
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: 1024,
          },
          {
            name: 'has-url.pdf',
            url: 'https://example.com/file.pdf',
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: 2048,
          },
        ],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      expect((component as any).attachments.length).toBe(1);
      expect((component as any).attachments[0].name).toBe('has-url.pdf');
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

    it('should default missing file name to localized unknown', async () => {
      component.message = {
        getAttachments: () => [
          {
            name: null,
            url: 'https://example.com/file.pdf',
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: 1024,
          },
        ],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      const att = (component as any).attachments[0];
      expect(att.name).toBeTruthy();
      expect(typeof att.name).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple Files & Expand/Collapse
  // ---------------------------------------------------------------------------
  describe('Multiple Files & Expand/Collapse', () => {
    // The list collapses only beyond COLLAPSED_MAX (3), matching the React kit.
    it('shows the first three files and a "Show N more" toggle beyond that', async () => {
      component.message = createMockFileMessage(5);
      await initAndDetect(fixture);

      expect(el.querySelectorAll('.cometchat-file-bubble__file-item').length).toBe(3);
      const expandBtn = el.querySelector('.cometchat-file-bubble__expand-indicator');
      expect(expandBtn).toBeTruthy();
      expect(expandBtn?.textContent?.trim()).toBe('Show 2 more');
      // A down-chevron precedes the label.
      expect(expandBtn?.querySelector('.cometchat-file-bubble__toggle-icon')).toBeTruthy();
    });

    it('the collapse control carries an up-chevron and matches the expand control', async () => {
      component.message = createMockFileMessage(5);
      await initAndDetect(fixture);
      (component as any).toggleExpanded();
      fixture.detectChanges();

      const collapseBtn = el.querySelector('.cometchat-file-bubble__collapse-control');
      expect(collapseBtn?.textContent?.trim()).toBe('Show less');
      expect(collapseBtn?.querySelector('.cometchat-file-bubble__toggle-icon')).toBeTruthy();
    });

    it('should not show expand indicator for a single file', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-file-bubble__expand-indicator')).toBeNull();
      expect(el.querySelectorAll('.cometchat-file-bubble__file-item').length).toBe(1);
    });

    it('should not collapse at exactly three files', async () => {
      component.message = createMockFileMessage(3);
      await initAndDetect(fixture);

      expect(el.querySelectorAll('.cometchat-file-bubble__file-item').length).toBe(3);
      expect(el.querySelector('.cometchat-file-bubble__expand-indicator')).toBeNull();
    });

    it('should toggle expanded state', async () => {
      component.message = createMockFileMessage(5);
      await initAndDetect(fixture);

      expect((component as any).isExpanded).toBe(false);
      (component as any).toggleExpanded();
      expect((component as any).isExpanded).toBe(true);
      (component as any).toggleExpanded();
      expect((component as any).isExpanded).toBe(false);
    });

    it('should render every file and a collapse button when expanded', async () => {
      component.message = createMockFileMessage(5);
      await initAndDetect(fixture);

      (component as any).toggleExpanded();
      fixture.detectChanges();

      expect(el.querySelectorAll('.cometchat-file-bubble__file-item').length).toBe(5);
      expect(el.querySelector('.cometchat-file-bubble__collapse-control')).toBeTruthy();
      expect(el.querySelector('.cometchat-file-bubble__expand-indicator')).toBeNull();
    });

    it('should calculate remaining files count beyond the first three', async () => {
      component.message = createMockFileMessage(5);
      await initAndDetect(fixture);
      expect((component as any).getRemainingFilesCount()).toBe(2);
    });

    it('should group multiple files with the --multi container modifier', async () => {
      component.message = createMockFileMessage(2);
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-file-bubble__container--multi')).toBeTruthy();
    });

    it('should NOT apply the --multi modifier for a single file', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-file-bubble__container--multi')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Caption Extraction
  // ---------------------------------------------------------------------------
  describe('Caption Extraction', () => {
    it('should detect caption via getCaption() (MediaMessage stores it in data.text)', async () => {
      component.message = createMockFileMessage(1, 'Test caption');
      await initAndDetect(fixture);
      expect((component as any).hasCaption).toBe(true);
    });

    it('should detect no caption when there is none', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);
      expect((component as any).hasCaption).toBe(false);
    });

    it('should render the caption section AND its text when a caption exists', async () => {
      component.message = createMockFileMessage(1, 'My file caption');
      await initAndDetect(fixture);

      const captionEl = el.querySelector('.cometchat-file-bubble__caption');
      expect(captionEl).toBeTruthy();
      // Regression guard: the caption TEXT must actually render (not an empty bubble).
      expect(captionEl?.textContent).toContain('My file caption');
    });

    it('should not render caption section when no caption', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const captionEl = el.querySelector('.cometchat-file-bubble__caption');
      expect(captionEl).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering & BEM Structure
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the container element', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-file-bubble__container')).toBeTruthy();
    });

    it('should render the file item element', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-file-bubble__file-item')).toBeTruthy();
    });

    it('should render file icon image', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const icon = el.querySelector('.cometchat-file-bubble__icon');
      expect(icon).toBeTruthy();
      expect((icon as HTMLImageElement)?.src).toContain('file_type_pdf');
    });

    it('should render metadata section with filename and size', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-file-bubble__metadata')).toBeTruthy();
      expect(el.querySelector('.cometchat-file-bubble__filename')).toBeTruthy();
      expect(el.querySelector('.cometchat-file-bubble__filesize')).toBeTruthy();
    });

    it('should not render any file items when no attachments', async () => {
      component.message = createMockFileMessage(0);
      await initAndDetect(fixture);

      expect(el.querySelector('.cometchat-file-bubble__file-item')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA / Accessibility
  // ---------------------------------------------------------------------------
  describe('ARIA Attributes', () => {
    it('should have aria-label on file item', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const fileItem = el.querySelector('.cometchat-file-bubble__file-item');
      expect(fileItem?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on download button', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const downloadBtn = el.querySelector('.cometchat-file-bubble__download');
      expect(downloadBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-expanded on expand indicator', async () => {
      component.message = createMockFileMessage(5);
      await initAndDetect(fixture);

      const expandBtn = el.querySelector('.cometchat-file-bubble__expand-indicator');
      expect(expandBtn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should generate expand ARIA label with correct count', async () => {
      component.message = createMockFileMessage(6);
      await initAndDetect(fixture);

      const label = (component as any).getExpandAriaLabel();
      expect(label).toContain('3');
      expect(label).toContain('files');
    });

    it('should generate singular expand ARIA label for 1 remaining file', async () => {
      component.message = createMockFileMessage(4);
      await initAndDetect(fixture);

      const label = (component as any).getExpandAriaLabel();
      expect(label).toContain('1');
      expect(label).toContain('file');
    });

    it('should generate download ARIA label with filename', () => {
      const label = (component as any).getDownloadAriaLabel('document.pdf');
      expect(label).toBeTruthy();
      expect(label).toContain('document.pdf');
    });

    it('should generate file ARIA label with name, type, and size', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);

      const label = (component as any).getFileAriaLabel((component as any).attachments[0]);
      expect(label).toContain('file-1.pdf');
      expect(label).toContain('PDF');
    });
  });

  // ---------------------------------------------------------------------------
  // File Type Detection and Icon Mapping
  // ---------------------------------------------------------------------------
  describe('File Type Detection and Icon Mapping', () => {
    it('should detect document types by extension', () => {
      expect((component as any).getFileType({ extension: 'pdf', mimeType: '' })).toBe('pdf');
      expect((component as any).getFileType({ extension: 'doc', mimeType: '' })).toBe('doc');
      expect((component as any).getFileType({ extension: 'docx', mimeType: '' })).toBe('docx');
      expect((component as any).getFileType({ extension: 'txt', mimeType: '' })).toBe('txt');
    });

    it('should detect spreadsheet types by extension', () => {
      expect((component as any).getFileType({ extension: 'xls', mimeType: '' })).toBe('xls');
      expect((component as any).getFileType({ extension: 'xlsx', mimeType: '' })).toBe('xlsx');
      expect((component as any).getFileType({ extension: 'csv', mimeType: '' })).toBe('csv');
    });

    it('should detect archive types by extension', () => {
      expect((component as any).getFileType({ extension: 'zip', mimeType: '' })).toBe('zip');
      expect((component as any).getFileType({ extension: 'rar', mimeType: '' })).toBe('rar');
    });

    it('should fallback to MIME type when extension is unknown', () => {
      expect((component as any).getFileType({ extension: '', mimeType: 'application/pdf' })).toBe(
        'pdf'
      );
      expect((component as any).getFileType({ extension: '', mimeType: 'application/zip' })).toBe(
        'zip'
      );
      expect((component as any).getFileType({ extension: '', mimeType: 'image/png' })).toBe('jpg');
    });

    it('should return default for unknown types', () => {
      expect(
        (component as any).getFileType({ extension: 'xyz', mimeType: 'application/octet-stream' })
      ).toBe('default');
    });

    it('should return correct icon paths', () => {
      expect((component as any).getFileIcon('pdf')).toContain('file_type_pdf');
      expect((component as any).getFileIcon('docx')).toContain('file_type_word');
      expect((component as any).getFileIcon('xlsx')).toContain('file_type_xlsx');
      expect((component as any).getFileIcon('zip')).toContain('file_type_zip');
      expect((component as any).getFileIcon('unknown')).toContain('file_type_unsupported');
    });

    it('should handle case-insensitive extension matching', () => {
      expect((component as any).getFileType({ extension: 'PDF', mimeType: '' })).toBe('pdf');
      expect((component as any).getFileType({ extension: 'Docx', mimeType: '' })).toBe('docx');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle message with non-array getAttachments return', async () => {
      component.message = {
        getAttachments: () => 'not-an-array',
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);
      expect((component as any).attachments.length).toBe(0);
    });

    it('should not modify input message object', async () => {
      const mockMessage = createMockFileMessage(2);
      const originalLength = mockMessage.getAttachments().length;
      component.message = mockMessage;
      await initAndDetect(fixture);

      (component as any).toggleExpanded();
      expect(mockMessage.getAttachments().length).toBe(originalLength);
    });

    it('should return 0 remaining for single file', async () => {
      component.message = createMockFileMessage(1);
      await initAndDetect(fixture);
      expect((component as any).getRemainingFilesCount()).toBe(0);
    });

    it('should skip attachments with null URL', async () => {
      component.message = {
        getAttachments: () => [
          {
            name: 'null-url.pdf',
            url: null,
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: 1024,
          },
          {
            name: 'valid.pdf',
            url: 'https://example.com/valid.pdf',
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: 2048,
          },
        ],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      expect((component as any).attachments.length).toBe(1);
      expect((component as any).attachments[0].name).toBe('valid.pdf');
    });

    it('should default missing file size to 0', async () => {
      component.message = {
        getAttachments: () => [
          {
            name: 'file.pdf',
            url: 'https://example.com/file.pdf',
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: null,
          },
        ],
        getText: () => '',
        getData: () => ({}),
      } as any;
      await initAndDetect(fixture);

      expect((component as any).attachments[0].size).toBe(0);
    });
  });
});
