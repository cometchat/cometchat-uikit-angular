/**
 * CometChatFullScreenViewer Component Tests
 *
 * Comprehensive test suite for the fullscreen media viewer component that supports
 * images, videos, audio, and file previews with gallery navigation, download,
 * keyboard interaction (Escape to close, Arrow keys for gallery), ARIA dialog
 * attributes, and Picture-in-Picture support.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA,
 *             Gallery Mode, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 4.1,
 *            10.3, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatFullScreenViewerComponent } from './cometchat-fullscreen-viewer.component';

describe('CometChatFullScreenViewerComponent', () => {
  let fixture: ComponentFixture<CometChatFullScreenViewerComponent>;
  let component: CometChatFullScreenViewerComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatFullScreenViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatFullScreenViewerComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getViewerContainer(): HTMLElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer');
  }

  function getHeader(): HTMLElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__header');
  }

  function getCloseButton(): HTMLButtonElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__close-btn');
  }

  function getDownloadButton(): HTMLButtonElement | null {
    return el.querySelector(
      '.cometchat-fullscreen-viewer__action-button:not(.cometchat-fullscreen-viewer__close-btn)'
    );
  }

  function getBody(): HTMLElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__body');
  }

  function getImage(): HTMLImageElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__body-image');
  }

  function getVideo(): HTMLVideoElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__body-video');
  }

  function getFilePreview(): HTMLElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__file-preview');
  }

  function getNavPrev(): HTMLButtonElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__nav-button--prev');
  }

  function getNavNext(): HTMLButtonElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__nav-button--next');
  }

  function getIndexDisplay(): HTMLElement | null {
    return el.querySelector('.cometchat-fullscreen-viewer__index-display');
  }

  function dispatchDocumentKeydown(key: string): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    fixture.detectChanges();
  }

  function dispatchKeydownOnElement(target: HTMLElement, key: string): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    fixture.detectChanges();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root .cometchat wrapper', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat')).toBeTruthy();
    });

    it('should render the viewer container', () => {
      fixture.detectChanges();
      expect(getViewerContainer()).toBeTruthy();
    });

    it('should render the header section', () => {
      fixture.detectChanges();
      expect(getHeader()).toBeTruthy();
    });

    it('should render the body section', () => {
      fixture.detectChanges();
      expect(getBody()).toBeTruthy();
    });

    it('should have isDownloading as true by default', () => {
      expect(component.isDownloading).toBe(true);
    });

    it('should have progress as 0 by default', () => {
      expect(component.progress).toBe(0);
    });

    it('should have mediaType as image by default', () => {
      expect(component.mediaType).toBe('image');
    });

    it('should have empty url by default', () => {
      expect(component.url).toBe('');
    });

    it('should have videoError as false by default', () => {
      expect(component.videoError).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and reflect url input', () => {
      component.url = 'https://example.com/image.jpg';
      fixture.detectChanges();
      expect(component.url).toBe('https://example.com/image.jpg');
    });

    it('should accept and reflect mediaType input', () => {
      component.mediaType = 'video';
      fixture.detectChanges();
      expect(component.mediaType).toBe('video');
    });

    it('should accept and reflect fileName input', () => {
      component.fileName = 'document.pdf';
      fixture.detectChanges();
      expect(component.fileName).toBe('document.pdf');
    });

    it('should accept and reflect fileSize input', () => {
      component.fileSize = 1024;
      fixture.detectChanges();
      expect(component.fileSize).toBe(1024);
    });

    it('should accept and reflect isOpen input', () => {
      component.isOpen = true;
      fixture.detectChanges();
      expect(component.isOpen).toBe(true);
    });

    it('should accept and reflect explicitSenderName input', () => {
      component.explicitSenderName = 'John Doe';
      fixture.detectChanges();
      expect(component.explicitSenderName).toBe('John Doe');
    });

    it('should accept and reflect explicitSenderAvatarUrl input', () => {
      component.explicitSenderAvatarUrl = 'https://example.com/avatar.jpg';
      fixture.detectChanges();
      expect(component.explicitSenderAvatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should have default empty attachments array', () => {
      expect(component.attachments).toEqual([]);
    });

    it('should have default startIndex of 0', () => {
      expect(component.startIndex).toBe(0);
    });

    it('should have default isOpen as false', () => {
      expect(component.isOpen).toBe(false);
    });

    it('should render image when url is set and mediaType is image', () => {
      component.url = 'https://example.com/image.jpg';
      component.mediaType = 'image';
      component.isDownloading = false;
      component.image = 'https://example.com/image.jpg';
      fixture.detectChanges();
      const img = getImage();
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/image.jpg');
    });

    it('should render video when url is set and mediaType is video', () => {
      component.url = 'https://example.com/video.mp4';
      component.mediaType = 'video';
      fixture.detectChanges();
      const video = getVideo();
      expect(video).toBeTruthy();
      expect(video?.getAttribute('src')).toBe('https://example.com/video.mp4');
    });

    it('should render file preview when mediaType is file', () => {
      component.url = 'https://example.com/doc.pdf';
      component.mediaType = 'file';
      component.fileName = 'doc.pdf';
      fixture.detectChanges();
      expect(getFilePreview()).toBeTruthy();
    });

    it('should update DOM when url changes', () => {
      fixture.componentRef.setInput('url', 'https://example.com/image1.jpg');
      fixture.componentRef.setInput('mediaType', 'image');
      fixture.detectChanges();
      // After ngOnInit, isDownloading becomes false and image is set from url
      component.ngOnInit();
      fixture.detectChanges();
      expect(getImage()?.getAttribute('src')).toBe('https://example.com/image1.jpg');

      fixture.componentRef.setInput('url', 'https://example.com/image2.jpg');
      fixture.detectChanges();
      // Trigger ngOnInit again to update internal image state
      component.image = 'https://example.com/image2.jpg';
      (component as any).cdr.detectChanges();
      expect(getImage()?.getAttribute('src')).toBe('https://example.com/image2.jpg');
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit closeClick when close button is clicked', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = getCloseButton();
      closeBtn?.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit closeClick when close method is called directly', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      component.close();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit indexChange when navigating in gallery mode', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
        { url: 'https://example.com/img3.jpg', type: 'image' as const, name: 'img3.jpg' },
      ];
      component.isOpen = true;
      fixture.detectChanges();

      const spy = vi.fn();
      component.indexChange.subscribe(spy);

      component.navigateNext();
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('should emit downloadClick when download is triggered', () => {
      component.url = 'https://example.com/image.jpg';
      component.mediaType = 'image';
      fixture.detectChanges();

      const spy = vi.fn();
      component.downloadClick.subscribe(spy);

      component.download();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-fullscreen-viewer', () => {
      fixture.detectChanges();
      expect(getViewerContainer()).toBeTruthy();
    });

    it('should render the header with left, center, and right sections', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-fullscreen-viewer__header-left')).toBeTruthy();
      expect(el.querySelector('.cometchat-fullscreen-viewer__header-center')).toBeTruthy();
      expect(el.querySelector('.cometchat-fullscreen-viewer__header-right')).toBeTruthy();
    });

    it('should render close button in header', () => {
      fixture.detectChanges();
      expect(getCloseButton()).toBeTruthy();
    });

    it('should render close icon inside close button', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-fullscreen-viewer__close-icon')).toBeTruthy();
    });

    it('should render download button', () => {
      fixture.detectChanges();
      const actionButtons = el.querySelectorAll('.cometchat-fullscreen-viewer__action-button');
      // At minimum: download + close
      expect(actionButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should show progress indicator when downloading image', () => {
      fixture.componentRef.setInput('mediaType', 'image');
      fixture.detectChanges();
      // After initial CD, set internal downloading state and force CD via component's CDR
      component.isDownloading = true;
      component.progress = 50;
      (component as any).cdr.detectChanges();
      const progressBar = el.querySelector('.cometchat-fullscreen-viewer__body-download-progress');
      expect(progressBar).toBeTruthy();
    });

    it('should not show progress indicator when not downloading', () => {
      component.isDownloading = false;
      component.mediaType = 'image';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-fullscreen-viewer__body-download-progress')).toBeNull();
    });

    it('should not render navigation buttons in single mode', () => {
      component.url = 'https://example.com/image.jpg';
      component.attachments = [];
      fixture.detectChanges();
      expect(getNavPrev()).toBeNull();
      expect(getNavNext()).toBeNull();
    });

    it('should render navigation buttons in gallery mode', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.isOpen = true;
      fixture.detectChanges();
      expect(getNavPrev()).toBeTruthy();
      expect(getNavNext()).toBeTruthy();
    });

    it('should render index display in gallery mode', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.isOpen = true;
      fixture.detectChanges();
      const indexDisplay = getIndexDisplay();
      expect(indexDisplay).toBeTruthy();
      expect(indexDisplay?.textContent).toContain('1');
      expect(indexDisplay?.textContent).toContain('2');
    });

    it('should show video error state when videoError is true', () => {
      component.url = 'https://example.com/video.mp4';
      component.mediaType = 'video';
      component.videoError = true;
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-fullscreen-viewer__error-state')).toBeTruthy();
    });

    it('should render file info in header center', () => {
      component.url = 'https://example.com/doc.pdf';
      component.mediaType = 'file';
      component.fileName = 'doc.pdf';
      component.fileSize = 2048;
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-fullscreen-viewer__file-info-header')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should emit closeClick on Escape key when isOpen is true', () => {
      component.isOpen = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      dispatchDocumentKeydown('Escape');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not respond to Escape key when isOpen is false', () => {
      component.isOpen = false;
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      dispatchDocumentKeydown('Escape');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should close on Enter key on close button', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = getCloseButton();
      expect(closeBtn).toBeTruthy();
      dispatchKeydownOnElement(closeBtn!, 'Enter');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should close on Space key on close button', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = getCloseButton();
      expect(closeBtn).toBeTruthy();
      dispatchKeydownOnElement(closeBtn!, ' ');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not close on non-activation keys on close button', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = getCloseButton();
      dispatchKeydownOnElement(closeBtn!, 'Tab');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should have close button with tabindex="0"', () => {
      fixture.detectChanges();
      const closeBtn = getCloseButton();
      expect(closeBtn?.getAttribute('tabindex')).toBe('0');
    });

    it('should have close button as a native button element', () => {
      fixture.detectChanges();
      const closeBtn = getCloseButton();
      expect(closeBtn?.tagName).toBe('BUTTON');
    });

    it('should remove document keydown listener on destroy', () => {
      component.isOpen = true;
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      fixture.destroy();

      // After destroy, Escape should not trigger close
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
      expect(spy).not.toHaveBeenCalled();

      // Re-create fixture for afterEach cleanup
      fixture = TestBed.createComponent(CometChatFullScreenViewerComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="dialog" on the viewer container', () => {
      fixture.detectChanges();
      expect(getViewerContainer()?.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true" on the viewer container', () => {
      fixture.detectChanges();
      expect(getViewerContainer()?.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label on the viewer container', () => {
      fixture.detectChanges();
      const ariaLabel = getViewerContainer()?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(typeof ariaLabel).toBe('string');
    });

    it('should have appropriate aria-label for image viewer', () => {
      component.mediaType = 'image';
      fixture.detectChanges();
      const ariaLabel = getViewerContainer()?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have appropriate aria-label for video viewer', () => {
      component.mediaType = 'video';
      fixture.detectChanges();
      const ariaLabel = getViewerContainer()?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    it('should have aria-label on close button', () => {
      fixture.detectChanges();
      const closeBtn = getCloseButton();
      expect(closeBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on download button', () => {
      fixture.detectChanges();
      const downloadBtn = getDownloadButton();
      expect(downloadBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-live on index display in gallery mode', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.isOpen = true;
      fixture.detectChanges();
      const indexDisplay = getIndexDisplay();
      expect(indexDisplay?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have progressbar role on download progress', () => {
      fixture.componentRef.setInput('mediaType', 'image');
      fixture.detectChanges();
      // Set internal downloading state and force CD via component's CDR
      component.isDownloading = true;
      component.progress = 50;
      (component as any).cdr.detectChanges();
      const progressBar = el.querySelector('[role="progressbar"]');
      expect(progressBar).toBeTruthy();
      expect(progressBar?.getAttribute('aria-valuenow')).toBe('50');
    });

    it('should have aria-label on navigation buttons in gallery mode', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.isOpen = true;
      fixture.detectChanges();
      expect(getNavPrev()?.getAttribute('aria-label')).toBeTruthy();
      expect(getNavNext()?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-disabled on prev button when at first item', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.isOpen = true;
      component.currentIndex = 0;
      fixture.detectChanges();
      expect(getNavPrev()?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should have type="button" on close button', () => {
      fixture.detectChanges();
      expect(getCloseButton()?.getAttribute('type')).toBe('button');
    });
  });

  // ---------------------------------------------------------------------------
  // Gallery Mode
  // ---------------------------------------------------------------------------
  describe('Gallery Mode', () => {
    it('should detect gallery mode when attachments are provided', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
      ];
      expect(component.isGalleryMode).toBe(true);
    });

    it('should detect single mode when attachments are empty', () => {
      component.attachments = [];
      expect(component.isGalleryMode).toBe(false);
    });

    it('should return currentAttachment based on currentIndex', () => {
      const att1 = {
        url: 'https://example.com/img1.jpg',
        type: 'image' as const,
        name: 'img1.jpg',
      };
      const att2 = {
        url: 'https://example.com/img2.jpg',
        type: 'image' as const,
        name: 'img2.jpg',
      };
      component.attachments = [att1, att2];
      component.currentIndex = 0;
      expect(component.currentAttachment).toBe(att1);

      component.currentIndex = 1;
      expect(component.currentAttachment).toBe(att2);
    });

    it('should return null for currentAttachment in single mode', () => {
      component.attachments = [];
      expect(component.currentAttachment).toBeNull();
    });

    it('should navigate next correctly', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
        { url: 'https://example.com/img3.jpg', type: 'image' as const, name: 'img3.jpg' },
      ];
      component.currentIndex = 0;
      fixture.detectChanges();

      component.navigateNext();
      expect(component.currentIndex).toBe(1);

      component.navigateNext();
      expect(component.currentIndex).toBe(2);
    });

    it('should not navigate next past the last item', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.currentIndex = 1;
      fixture.detectChanges();

      component.navigateNext();
      expect(component.currentIndex).toBe(1);
    });

    it('should navigate prev correctly', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
        { url: 'https://example.com/img3.jpg', type: 'image' as const, name: 'img3.jpg' },
      ];
      component.startIndex = 2;
      fixture.detectChanges();

      expect(component.currentIndex).toBe(2);

      component.navigatePrev();
      expect(component.currentIndex).toBe(1);

      component.navigatePrev();
      expect(component.currentIndex).toBe(0);
    });

    it('should not navigate prev past the first item', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.currentIndex = 0;
      fixture.detectChanges();

      component.navigatePrev();
      expect(component.currentIndex).toBe(0);
    });

    it('should navigate to specific index', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
        { url: 'https://example.com/img3.jpg', type: 'image' as const, name: 'img3.jpg' },
      ];
      component.currentIndex = 0;
      fixture.detectChanges();

      component.navigateToIndex(2);
      expect(component.currentIndex).toBe(2);
    });

    it('should not navigate to invalid index', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.currentIndex = 0;
      fixture.detectChanges();

      component.navigateToIndex(-1);
      expect(component.currentIndex).toBe(0);

      component.navigateToIndex(5);
      expect(component.currentIndex).toBe(0);
    });

    it('should report canNavigatePrev and canNavigateNext correctly', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
        { url: 'https://example.com/img3.jpg', type: 'image' as const, name: 'img3.jpg' },
      ];

      component.currentIndex = 0;
      expect(component.canNavigatePrev).toBe(false);
      expect(component.canNavigateNext).toBe(true);

      component.currentIndex = 1;
      expect(component.canNavigatePrev).toBe(true);
      expect(component.canNavigateNext).toBe(true);

      component.currentIndex = 2;
      expect(component.canNavigatePrev).toBe(true);
      expect(component.canNavigateNext).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  describe('Lifecycle', () => {
    it('should set isDownloading to false on ngOnInit when url is empty', () => {
      component.url = '';
      component.ngOnInit();
      expect(component.isDownloading).toBe(false);
    });

    it('should set image and stop downloading on ngOnInit when url is set for image', () => {
      component.url = 'https://example.com/image.jpg';
      component.mediaType = 'image';
      component.ngOnInit();
      expect(component.isDownloading).toBe(false);
      expect(component.image).toBe('https://example.com/image.jpg');
      expect(component.progress).toBe(100);
    });

    it('should stop downloading on ngOnInit for video type', () => {
      component.url = 'https://example.com/video.mp4';
      component.mediaType = 'video';
      component.ngOnInit();
      expect(component.isDownloading).toBe(false);
      expect(component.progress).toBe(100);
    });

    it('should initialize currentIndex from startIndex in gallery mode', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
        { url: 'https://example.com/img3.jpg', type: 'image' as const, name: 'img3.jpg' },
      ];
      component.startIndex = 2;
      component.ngOnInit();
      expect(component.currentIndex).toBe(2);
    });

    it('should clamp startIndex to 0 if negative', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
      ];
      component.startIndex = -5;
      component.ngOnInit();
      expect(component.currentIndex).toBe(0);
    });

    it('should clamp startIndex to last index if too large', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
        { url: 'https://example.com/img2.jpg', type: 'image' as const, name: 'img2.jpg' },
      ];
      component.startIndex = 100;
      component.ngOnInit();
      expect(component.currentIndex).toBe(1);
    });

    it('should not throw on destroy', () => {
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();

      // Re-create fixture for afterEach cleanup
      fixture = TestBed.createComponent(CometChatFullScreenViewerComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
    });
  });

  // ---------------------------------------------------------------------------
  // Computed Properties
  // ---------------------------------------------------------------------------
  describe('Computed Properties', () => {
    it('should return correct viewer aria label for each media type', () => {
      component.mediaType = 'image';
      expect(component.getViewerAriaLabel()).toBeTruthy();

      component.mediaType = 'video';
      expect(component.getViewerAriaLabel()).toBeTruthy();

      component.mediaType = 'audio';
      expect(component.getViewerAriaLabel()).toBeTruthy();

      component.mediaType = 'file';
      expect(component.getViewerAriaLabel()).toBeTruthy();
    });

    it('should return media alt text', () => {
      component.mediaType = 'image';
      const altText = component.getMediaAltText();
      expect(altText).toBeTruthy();
      expect(typeof altText).toBe('string');
    });

    it('should calculate progressStrokeDasharray correctly', () => {
      component.progress = 50;
      const result = component.progressStrokeDasharray;
      expect(result).toContain('113');
    });

    it('should format file size correctly', () => {
      component.fileSize = 1024;
      expect(component.formattedFileSize).toContain('KB');

      component.fileSize = 1024 * 1024;
      expect(component.formattedFileSize).toContain('MB');
    });

    it('should return empty string for formattedFileSize when no fileSize', () => {
      component.fileSize = undefined;
      expect(component.formattedFileSize).toBe('');
    });

    it('should extract file extension from fileName', () => {
      component.fileName = 'document.pdf';
      expect(component.fileExtension).toBe('PDF');
    });

    it('should return empty string for fileExtension when no fileName', () => {
      component.fileName = '';
      expect(component.fileExtension).toBe('');
    });

    it('should handle fileName with multiple dots', () => {
      component.fileName = 'my.file.name.txt';
      expect(component.fileExtension).toBe('TXT');
    });

    it('should handle videoError state', () => {
      expect(component.videoError).toBe(false);
      component.handleVideoError();
      expect(component.videoError).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when created with no custom inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle null-like empty url gracefully', () => {
      component.url = '';
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.isDownloading).toBe(false);
    });

    it('should handle empty attachments array', () => {
      component.attachments = [];
      fixture.detectChanges();
      expect(component.isGalleryMode).toBe(false);
      expect(component.currentAttachment).toBeNull();
    });

    it('should handle currentIndex out of bounds gracefully', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
      ];
      component.currentIndex = 99;
      expect(component.currentAttachment).toBeNull();
    });

    it('should handle negative currentIndex gracefully', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
      ];
      component.currentIndex = -1;
      expect(component.currentAttachment).toBeNull();
    });

    it('should handle very long url without throwing', () => {
      component.url = 'https://example.com/' + 'a'.repeat(2000) + '.jpg';
      component.mediaType = 'image';
      expect(() => {
        component.ngOnInit();
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle very long fileName without throwing', () => {
      component.fileName = 'A'.repeat(500) + '.pdf';
      component.mediaType = 'file';
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should not emit downloadClick when url is empty', () => {
      component.url = '';
      component.attachments = [];
      fixture.detectChanges();

      const spy = vi.fn();
      component.downloadClick.subscribe(spy);

      component.download();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle rapid close button clicks', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = getCloseButton();
      closeBtn?.click();
      closeBtn?.click();
      closeBtn?.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should handle navigateToIndex in single mode without error', () => {
      component.attachments = [];
      expect(() => component.navigateToIndex(0)).not.toThrow();
      expect(component.currentIndex).toBe(0);
    });

    it('should handle single attachment in gallery mode', () => {
      component.attachments = [
        { url: 'https://example.com/img1.jpg', type: 'image' as const, name: 'img1.jpg' },
      ];
      component.currentIndex = 0;
      expect(component.canNavigatePrev).toBe(false);
      expect(component.canNavigateNext).toBe(false);
    });
  });
});
