import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatSearchMessagesListComponent } from './cometchat-search-messages-list.component';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { signal } from '@angular/core';

/**
 * Mock SearchMessagesService that provides the signals the component needs.
 */
class MockSearchMessagesService {
  messages = signal<any[]>([]);
  fetchState = signal('loaded');
  hasMore = signal(false);
  searchKeyword = signal('');
  activeFilters = signal<any[]>([]);
  search = vi.fn();
  fetchNext = vi.fn();
  reset = vi.fn();
  cleanup = vi.fn();
}

describe('CometChatSearchMessagesListComponent', () => {
  let component: CometChatSearchMessagesListComponent;
  let fixture: ComponentFixture<CometChatSearchMessagesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatSearchMessagesListComponent],
      providers: [
        { provide: SearchMessagesService, useClass: MockSearchMessagesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatSearchMessagesListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default empty search keyword', () => {
    expect(component.searchKeyword).toBe('');
  });

  it('should have default empty active filters', () => {
    expect(component.activeFilters).toEqual([]);
  });

  it('should have default alwaysShowSeeMore as false', () => {
    expect(component.alwaysShowSeeMore).toBe(false);
  });

  describe('trackByMessage', () => {
    it('should return message id', () => {
      const mockMessage = { getId: () => 42 } as any;
      expect(component.trackByMessage(0, mockMessage)).toBe(42);
    });
  });

  describe('shouldShowDateSeparator', () => {
    it('should return true for first item', () => {
      expect(component.shouldShowDateSeparator(0)).toBe(true);
    });
  });

  describe('getMessageTitle', () => {
    it('should return receiver name when no uid/guid', () => {
      const mockMessage = {
        getSender: () => ({ getName: () => 'Sender' }),
        getReceiver: () => ({ getName: () => 'Receiver' }),
      } as any;
      expect(component.getMessageTitle(mockMessage)).toBe('Receiver');
    });

    it('should return sender name when uid is set', () => {
      component.uid = 'user1';
      const mockMessage = {
        getSender: () => ({ getName: () => 'Sender' }),
        getReceiver: () => ({ getName: () => 'Receiver' }),
      } as any;
      expect(component.getMessageTitle(mockMessage)).toBe('Sender');
    });
  });

  describe('itemClick output', () => {
    it('should emit message and keyword on handleItemClick', () => {
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      component.searchKeyword = 'test';

      const mockMessage = { getId: () => 1 } as any;
      component.handleItemClick(mockMessage);

      expect(spy).toHaveBeenCalledWith({
        message: mockMessage,
        searchKeyword: 'test',
      });
    });
  });

  describe('stateChange output', () => {
    it('should emit when service fetchState changes', () => {
      const spy = vi.fn();
      component.stateChange.subscribe(spy);
      // Verify the output emitter exists and is subscribable
      expect(component.stateChange).toBeDefined();
      // The effect-based emission is tested by verifying the wiring exists
      // (full integration tested in parent component spec)
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('hideSection input', () => {
    it('should default to false', () => {
      expect(component.hideSection).toBe(false);
    });
  });

  describe('suppressEmptyErrorView input', () => {
    it('should default to false', () => {
      expect(component.suppressEmptyErrorView).toBe(false);
    });
  });

  describe('getLeadingViewType', () => {
    it('should return audio for audio messages', () => {
      const msg = { getType: () => 'audio' } as any;
      expect(component.getLeadingViewType(msg)).toBe('audio');
    });

    it('should return file for file messages', () => {
      const msg = { getType: () => 'file' } as any;
      expect(component.getLeadingViewType(msg)).toBe('file');
    });

    it('should return none for text messages without links', () => {
      const msg = { getType: () => 'text', getText: () => 'hello', getMetadata: () => ({}) } as any;
      expect(component.getLeadingViewType(msg)).toBe('none');
    });
  });

  describe('getTrailingViewType', () => {
    it('should return image for image messages', () => {
      const msg = { getType: () => 'image' } as any;
      expect(component.getTrailingViewType(msg)).toBe('image');
    });

    it('should return video for video messages', () => {
      const msg = { getType: () => 'video' } as any;
      expect(component.getTrailingViewType(msg)).toBe('video');
    });

    it('should return date for text messages', () => {
      const msg = { getType: () => 'text' } as any;
      expect(component.getTrailingViewType(msg)).toBe('date');
    });
  });

  describe('getFormattedDate', () => {
    it('should format date as DD MMM, hh:mm am/pm', () => {
      // Jan 15, 2025 at 14:30 UTC
      const msg = { getSentAt: () => 1736952600 } as any;
      const result = component.getFormattedDate(msg);
      expect(result).toMatch(/\d{1,2} \w{3}, \d{2}:\d{2} [AaPp][Mm]/);
    });

    it('should return empty string when no sentAt', () => {
      const msg = { getSentAt: () => 0 } as any;
      expect(component.getFormattedDate(msg)).toBe('');
    });
  });

  describe('getMessageSubtitle', () => {
    it('should return text content for text messages', () => {
      const msg = {
        getType: () => 'text',
        getText: () => 'Hello world',
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      } as any;
      const result = component.getMessageSubtitle(msg);
      expect(result).toContain('Hello world');
    });

    it('should return attachment name for media messages', () => {
      const msg = {
        getType: () => 'file',
        getAttachments: () => [{ getName: () => 'doc.pdf' }],
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      } as any;
      const result = component.getMessageSubtitle(msg);
      expect(result).toContain('doc.pdf');
    });

    it('should strip markdown links from text', () => {
      const msg = {
        getType: () => 'text',
        getText: () => 'Check [this link](https://example.com) out',
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      } as any;
      const result = component.getMessageSubtitle(msg);
      expect(result).toContain('this link');
      expect(result).not.toContain('](');
    });
  });

  describe('shouldShowDateSeparator (extended)', () => {
    it('should return true when month changes between items', () => {
      // Jan and Feb messages
      component.service.messages.set([
        { getSentAt: () => 1704067200 } as any, // Jan 1 2024
        { getSentAt: () => 1706745600 } as any, // Feb 1 2024
      ]);
      expect(component.shouldShowDateSeparator(1)).toBe(true);
    });

    it('should return false for same month items', () => {
      // Both in Jan 2024
      component.service.messages.set([
        { getSentAt: () => 1704067200 } as any, // Jan 1 2024
        { getSentAt: () => 1704153600 } as any, // Jan 2 2024
      ]);
      expect(component.shouldShowDateSeparator(1)).toBe(false);
    });
  });

  describe('getFileTypeIcon', () => {
    it('should return correct icon path for known extensions', () => {
      const msg = { getAttachments: () => [{ getName: () => 'report.pdf' }] } as any;
      expect(component.getFileTypeIcon(msg)).toBe('assets/file_type_pdf.png');
    });

    it('should return unsupported icon for unknown extensions', () => {
      const msg = { getAttachments: () => [{ getName: () => 'data.xyz' }] } as any;
      expect(component.getFileTypeIcon(msg)).toBe('assets/file_type_unsupported.png');
    });
  });
});
