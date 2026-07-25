import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';
import { CometChatAttachmentTrayComponent } from './cometchat-attachment-tray.component';
import { CometChatAttachmentTileComponent } from '../cometchat-attachment-tile';
import { CometChatFullScreenViewerComponent } from '../base-elements/cometchat-fullscreen-viewer';
import { MediaUploadTrayService } from '../../services/media-upload-tray.service';
import type { AttachmentFile } from '../cometchat-message-composer/cometchat-message-composer.types';

function tile(over: Partial<AttachmentFile> = {}): AttachmentFile {
  return {
    id: 'i',
    fileId: over.fileId ?? 'f',
    file: new File([new Uint8Array(1)], 'a'),
    type: 'image',
    name: 'a.png',
    size: 1,
    uploadProgress: 100,
    status: 'uploaded',
    ...over,
  } as AttachmentFile;
}

function stub(
  tiles: AttachmentFile[],
  agg = { loaded: 0, total: 0, percent: 0 },
) {
  return {
    tiles: signal(tiles),
    hasTiles: signal(tiles.length > 0),
    aggregate: signal(agg),
    notice: signal<string | null>(null),
    cancel: vi.fn(),
    remove: vi.fn(),
    retry: vi.fn(),
  };
}

async function setup(
  s: ReturnType<typeof stub>,
): Promise<ComponentFixture<CometChatAttachmentTrayComponent>> {
  await TestBed.configureTestingModule({
    imports: [CometChatAttachmentTrayComponent],
    providers: [
      { provide: MediaUploadTrayService, useValue: s as unknown as MediaUploadTrayService },
    ],
  })
    // Neutralise the real fullscreen viewer's DOM/lifecycle in tests.
    .overrideComponent(CometChatFullScreenViewerComponent, {
      set: { template: '<div></div>', styles: [] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(CometChatAttachmentTrayComponent);
  fixture.detectChanges();
  return fixture;
}

describe('CometChatAttachmentTrayComponent', () => {
  it('is hidden when the tray is empty', async () => {
    const fixture = await setup(stub([]));
    expect(
      fixture.nativeElement.querySelector('.cometchat-attachment-tray'),
    ).toBeNull();
  });

  it('renders one tile per staged file', async () => {
    const fixture = await setup(stub([tile({ fileId: 'a' }), tile({ fileId: 'b' })]));
    const tiles = fixture.debugElement.queryAll(
      By.directive(CometChatAttachmentTileComponent),
    );
    expect(tiles.length).toBe(2);
  });

  it('routes tile actions to the service', async () => {
    const s = stub([tile({ fileId: 'a' })]);
    const fixture = await setup(s);
    const tileCmp = fixture.debugElement.query(
      By.directive(CometChatAttachmentTileComponent),
    ).componentInstance as CometChatAttachmentTileComponent;
    const t = s.tiles()[0];
    tileCmp.cancelClick.emit(t);
    tileCmp.removeClick.emit(t);
    tileCmp.retryClick.emit(t);
    expect(s.cancel).toHaveBeenCalledWith(t);
    expect(s.remove).toHaveBeenCalledWith(t);
    expect(s.retry).toHaveBeenCalledWith(t);
  });

  it('opens the fullscreen viewer on tileClick (with a url)', async () => {
    const s = stub([tile({ fileId: 'a', thumbnailUrl: 'blob:x' })]);
    const fixture = await setup(s);
    const comp = fixture.componentInstance;
    const tileCmp = fixture.debugElement.query(
      By.directive(CometChatAttachmentTileComponent),
    ).componentInstance as CometChatAttachmentTileComponent;
    tileCmp.tileClick.emit(s.tiles()[0]);
    expect(comp.viewer().open).toBe(true);
    expect(comp.viewer().url).toBe('blob:x');
    comp.closeViewer();
    expect(comp.viewer().open).toBe(false);
  });

});
