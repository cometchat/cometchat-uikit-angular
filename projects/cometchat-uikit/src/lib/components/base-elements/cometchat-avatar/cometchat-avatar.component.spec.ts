/**
 * CometChatAvatar Component Tests
 *
 * Comprehensive test suite for the avatar component that displays an image
 * or initials derived from a name, with fallback behavior when the image
 * fails to load.
 *
 * Categories: Initialization, Input Bindings, DOM Rendering,
 *             Conditional Rendering, Image Error Handling,
 *             ARIA / Accessibility, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 2.5, 3.1, 3.2,
 *            3.5, 10.5, 11.1, 11.2, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup, fetchTestUser } from '../../../testing';
import { CometChatAvatarComponent } from './cometchat-avatar.component';

describe('CometChatAvatarComponent', () => {
  let fixture: ComponentFixture<CometChatAvatarComponent>;
  let component: CometChatAvatarComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatAvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatAvatarComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default empty image input', () => {
      expect(component.image).toBe('');
    });

    it('should have default empty name input', () => {
      expect(component.name).toBe('');
    });

    it('should have imageError as false initially', () => {
      expect(component.imageError).toBe(false);
    });

    it('should render the root .cometchat-avatar container', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and reflect image URL input', () => {
      component.image = 'https://example.com/avatar.png';
      fixture.detectChanges();
      expect(component.image).toBe('https://example.com/avatar.png');
    });

    it('should accept and reflect name input', () => {
      component.name = 'John Doe';
      fixture.detectChanges();
      expect(component.name).toBe('John Doe');
    });

    it('should render image element when image URL is set', () => {
      component.image = 'https://example.com/avatar.png';
      fixture.detectChanges();
      const img = el.querySelector('.cometchat-avatar__image') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toBe('https://example.com/avatar.png');
    });

    it('should update DOM when name input changes', () => {
      component.name = 'Alice';
      fixture.detectChanges();
      let text = el.querySelector('.cometchat-avatar__text');
      expect(text?.textContent?.trim()).toBe('AL');

      fixture.componentRef.setInput('name', 'Bob Smith');
      fixture.detectChanges();
      text = el.querySelector('.cometchat-avatar__text');
      expect(text?.textContent?.trim()).toBe('BS');
    });

    it('should handle null-like empty string for image gracefully', () => {
      component.image = '';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar__image')).toBeNull();
    });

    it('should handle null-like empty string for name gracefully', () => {
      component.name = '';
      fixture.detectChanges();
      const text = el.querySelector('.cometchat-avatar__text');
      expect(text).toBeTruthy();
      expect(text?.textContent?.trim()).toBe('');
    });

    it('should use real CometChat.User avatar data from fetchTestUser', async () => {
      const user = await fetchTestUser('superhero1');
      component.image = user.getAvatar() ?? '';
      component.name = user.getName();
      fixture.detectChanges();

      if (user.getAvatar()) {
        const img = el.querySelector('.cometchat-avatar__image') as HTMLImageElement;
        expect(img).toBeTruthy();
        expect(img.src).toBe(user.getAvatar());
      } else {
        const text = el.querySelector('.cometchat-avatar__text');
        expect(text).toBeTruthy();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Initials Generation
  // ---------------------------------------------------------------------------
  describe('Initials Generation', () => {
    it('should generate two-letter initials from two-word name', () => {
      component.name = 'John Doe';
      expect(component.initials).toBe('JD');
    });

    it('should generate initials from multi-word name using first two words', () => {
      component.name = 'Alice Bob Charlie';
      expect(component.initials).toBe('AB');
    });

    it('should generate two-character initials from single-word name', () => {
      component.name = 'Alice';
      expect(component.initials).toBe('AL');
    });

    it('should uppercase initials', () => {
      component.name = 'john doe';
      expect(component.initials).toBe('JD');
    });

    it('should return empty string for empty name', () => {
      component.name = '';
      expect(component.initials).toBe('');
    });

    it('should handle single character name', () => {
      component.name = 'A';
      expect(component.initials).toBe('A');
    });

    it('should handle name with extra spaces', () => {
      component.name = '  John   Doe  ';
      expect(component.initials).toBe('JD');
    });

    it('should generate initials from unicode name', () => {
      component.name = 'José María';
      expect(component.initials).toBe('JM');
    });
  });

  // ---------------------------------------------------------------------------
  // Conditional Rendering (image vs initials)
  // ---------------------------------------------------------------------------
  describe('Conditional Rendering', () => {
    it('should show image when image URL is set and no error', () => {
      component.image = 'https://example.com/avatar.png';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar__image')).toBeTruthy();
      expect(el.querySelector('.cometchat-avatar__text')).toBeNull();
    });

    it('should show initials when no image is provided', () => {
      component.name = 'John Doe';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar__text')).toBeTruthy();
      expect(el.querySelector('.cometchat-avatar__image')).toBeNull();
    });

    it('should show initials text content matching computed initials', () => {
      component.name = 'John Doe';
      fixture.detectChanges();
      const text = el.querySelector('.cometchat-avatar__text');
      expect(text?.textContent?.trim()).toBe('JD');
    });

    it('should show initials after image error (fallback)', () => {
      component.image = 'https://example.com/broken.png';
      component.name = 'John Doe';
      fixture.detectChanges();

      // Dispatch error event on the img element to trigger Angular's (error) binding
      const img = el.querySelector('.cometchat-avatar__image') as HTMLImageElement;
      expect(img).toBeTruthy();
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(component.showImage).toBe(false);
      const text = el.querySelector('.cometchat-avatar__text');
      expect(text).toBeTruthy();
      expect(text?.textContent?.trim()).toBe('JD');
    });

    it('should show empty initials when both image and name are empty', () => {
      fixture.detectChanges();
      const text = el.querySelector('.cometchat-avatar__text');
      expect(text).toBeTruthy();
      expect(text?.textContent?.trim()).toBe('');
    });

    it('should switch from image to initials on error', () => {
      component.image = 'https://example.com/avatar.png';
      component.name = 'Test User';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar__image')).toBeTruthy();

      // Dispatch error event on the img element to trigger Angular's (error) binding
      const img = el.querySelector('.cometchat-avatar__image') as HTMLImageElement;
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(component.showImage).toBe(false);
      expect(el.querySelector('.cometchat-avatar__text')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Image Error Handling
  // ---------------------------------------------------------------------------
  describe('Image Error Handling', () => {
    it('should set imageError to true on onImageError', () => {
      component.onImageError();
      expect(component.imageError).toBe(true);
    });

    it('should reset imageError via resetImageError', () => {
      component.onImageError();
      expect(component.imageError).toBe(true);
      component.resetImageError();
      expect(component.imageError).toBe(false);
    });

    it('should show image again after resetImageError when image URL exists', () => {
      component.image = 'https://example.com/avatar.png';
      component.onImageError();
      fixture.detectChanges();
      expect(component.showImage).toBe(false);

      component.resetImageError();
      fixture.componentRef.setInput('image', component.image);
      fixture.detectChanges();
      expect(component.showImage).toBe(true);
      expect(el.querySelector('.cometchat-avatar__image')).toBeTruthy();
    });

    it('should handle multiple consecutive onImageError calls', () => {
      component.onImageError();
      component.onImageError();
      expect(component.imageError).toBe(true);
    });

    it('showImage should be false when image is empty even if imageError is false', () => {
      component.image = '';
      component.imageError = false;
      expect(component.showImage).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA / Accessibility
  // ---------------------------------------------------------------------------
  describe('ARIA / Accessibility', () => {
    it('should have role="img" on the avatar container', () => {
      fixture.detectChanges();
      const avatar = el.querySelector('.cometchat-avatar');
      expect(avatar?.getAttribute('role')).toBe('img');
    });

    it('should have aria-label="Avatar" when no name is provided', () => {
      fixture.detectChanges();
      const avatar = el.querySelector('.cometchat-avatar');
      expect(avatar?.getAttribute('aria-label')).toBe('Avatar');
    });

    it('should have aria-label="Avatar for {name}" when name is provided', () => {
      component.name = 'John Doe';
      fixture.detectChanges();
      const avatar = el.querySelector('.cometchat-avatar');
      expect(avatar?.getAttribute('aria-label')).toBe('Avatar for John Doe');
    });

    it('should set aria-hidden="true" on initials text span', () => {
      component.name = 'John Doe';
      fixture.detectChanges();
      const text = el.querySelector('.cometchat-avatar__text');
      expect(text?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should set alt attribute on image element matching name', () => {
      component.image = 'https://example.com/avatar.png';
      component.name = 'John Doe';
      fixture.detectChanges();
      const img = el.querySelector('.cometchat-avatar__image');
      expect(img?.getAttribute('alt')).toBe('John Doe');
    });

    it('should set alt="avatar" when name is empty and image is shown', () => {
      component.image = 'https://example.com/avatar.png';
      fixture.detectChanges();
      const img = el.querySelector('.cometchat-avatar__image');
      expect(img?.getAttribute('alt')).toBe('avatar');
    });

    it('should maintain role="img" regardless of rendering mode', () => {
      component.image = 'https://example.com/avatar.png';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar')?.getAttribute('role')).toBe('img');

      component.onImageError();
      fixture.componentRef.setInput('image', component.image);
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar')?.getAttribute('role')).toBe('img');
    });

    it('should update aria-label dynamically when name changes', () => {
      component.name = 'Alice';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar')?.getAttribute('aria-label')).toBe(
        'Avatar for Alice'
      );

      fixture.componentRef.setInput('name', 'Bob');
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar')?.getAttribute('aria-label')).toBe(
        'Avatar for Bob'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering (BEM classes)
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-avatar', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar')).toBeTruthy();
    });

    it('should render .cometchat-avatar__image when image is provided', () => {
      component.image = 'https://example.com/avatar.png';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar__image')).toBeTruthy();
    });

    it('should render .cometchat-avatar__text when no image is provided', () => {
      component.name = 'Test';
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-avatar__text')).toBeTruthy();
    });

    it('should set loading="lazy" on the image element', () => {
      component.image = 'https://example.com/avatar.png';
      fixture.detectChanges();
      const img = el.querySelector('.cometchat-avatar__image') as HTMLImageElement;
      expect(img?.loading).toBe('lazy');
    });

    it('should display correct text content for initials', () => {
      component.name = 'Super Hero';
      fixture.detectChanges();
      const text = el.querySelector('.cometchat-avatar__text');
      expect(text?.textContent?.trim()).toBe('SH');
    });
  });

  // ---------------------------------------------------------------------------
  // Real SDK Integration
  // ---------------------------------------------------------------------------
  describe('Real SDK Integration', () => {
    it('should display avatar from a real CometChat.User object', async () => {
      const user = await fetchTestUser('superhero1');
      component.image = user.getAvatar() ?? '';
      component.name = user.getName();
      fixture.detectChanges();

      // The user should have a name at minimum
      expect(user.getName()).toBeTruthy();

      const avatar = el.querySelector('.cometchat-avatar');
      expect(avatar).toBeTruthy();
      expect(avatar?.getAttribute('aria-label')).toBe(`Avatar for ${user.getName()}`);
    });

    it('should generate initials from real user name when no avatar URL', async () => {
      const user = await fetchTestUser('superhero1');
      // Intentionally skip the avatar URL to test initials
      component.name = user.getName();
      fixture.detectChanges();

      const text = el.querySelector('.cometchat-avatar__text');
      expect(text).toBeTruthy();
      expect(text?.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle whitespace-only name', () => {
      component.name = '   ';
      fixture.detectChanges();
      // Component should not throw
      const text = el.querySelector('.cometchat-avatar__text');
      expect(text).toBeTruthy();
    });

    it('should handle name with special characters', () => {
      component.name = "O'Brien-Smith";
      fixture.detectChanges();
      expect(component.ariaLabel).toBe("Avatar for O'Brien-Smith");
    });

    it('should handle very long name', () => {
      component.name = 'A Very Long Name With Many Words That Goes On And On';
      fixture.detectChanges();
      // Should still generate initials from first two words
      expect(component.initials).toBe('AV');
    });

    it('should handle data URI for image', () => {
      component.image = 'data:image/png;base64,iVBORw0KGgo=';
      fixture.detectChanges();
      const img = el.querySelector('.cometchat-avatar__image') as HTMLImageElement;
      expect(img).toBeTruthy();
    });

    it('should not throw when image and name are both empty', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle rapid image/name changes without errors', () => {
      component.image = 'https://example.com/1.png';
      component.name = 'User One';
      fixture.detectChanges();

      fixture.componentRef.setInput('image', '');
      fixture.componentRef.setInput('name', 'User Two');
      fixture.detectChanges();

      fixture.componentRef.setInput('image', 'https://example.com/2.png');
      fixture.componentRef.setInput('name', 'User Three');
      fixture.detectChanges();

      expect(component.showImage).toBe(true);
      expect(el.querySelector('.cometchat-avatar__image')).toBeTruthy();
    });
  });
});
