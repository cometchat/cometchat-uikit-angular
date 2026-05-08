/**
 * Renderer
 *
 * Canvas-based waveform rendering.
 * Adapted from WaveSurfer library for Angular compatibility.
 *
 * @see Requirements 14.1, 14.2
 */

import { makeDraggable } from './draggable';
import EventEmitter from './event-emitter';
import type { WaveSurferOptions } from './wavesurfer';
import type { RendererEvents } from './renderer.types';
import {
  convertColorValues,
  renderWaveform,
  buildRendererHtml,
  scrollIntoView,
} from './renderer.utils';

// Re-export types for backward compatibility
export type { RendererEvents } from './renderer.types';

class Renderer extends EventEmitter<RendererEvents> {
  private static MAX_CANVAS_WIDTH = 8000;
  private static MAX_NODES = 10;
  private options: WaveSurferOptions;
  private parent: HTMLElement;
  private container: HTMLElement;
  private scrollContainer: HTMLElement;
  private wrapper: HTMLElement;
  private canvasWrapper: HTMLElement;
  private progressWrapper: HTMLElement;
  private cursor: HTMLElement;
  private timeouts: Array<() => void> = [];
  private isScrollable = false;
  private audioData: AudioBuffer | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastContainerWidth = 0;
  private isDragging = false;
  private subscriptions: (() => void)[] = [];
  private unsubscribeOnScroll?: () => void;
  private iframeDocument: Document = document;
  private iframeWindow: Window = window;

  constructor(
    options: WaveSurferOptions,
    audioElement?: HTMLElement,
    iframeDocument?: Document,
    iframeWindow?: Window
  ) {
    super();
    this.subscriptions = [];
    this.options = options;
    this.iframeDocument = iframeDocument || document;
    this.iframeWindow = iframeWindow || window;

    const parent = this.parentFromOptionsContainer(options.container);
    this.parent = parent;

    const [div, shadow] = buildRendererHtml(
      this.getHeight(options.height, options.splitChannels),
      options.cspNonce,
      this.iframeDocument
    );
    parent.appendChild(div);
    this.container = div;
    this.scrollContainer = shadow.querySelector('.scroll') as HTMLElement;
    this.wrapper = shadow.querySelector('.wrapper') as HTMLElement;
    this.canvasWrapper = shadow.querySelector('.canvases') as HTMLElement;
    this.progressWrapper = shadow.querySelector('.progress') as HTMLElement;
    this.cursor = shadow.querySelector('.cursor') as HTMLElement;

    if (audioElement) shadow.appendChild(audioElement);
    this.initEvents();
  }

  private parentFromOptionsContainer(container: WaveSurferOptions['container']): HTMLElement {
    let parent: HTMLElement | null = null;
    if (typeof container === 'string') {
      parent = this.iframeDocument.querySelector(container) as HTMLElement | null;
    } else if (container instanceof HTMLElement) {
      parent = container;
    } else if (this.iframeWindow && (container as any) instanceof (this.iframeWindow as any)?.HTMLElement) {
      parent = container as HTMLElement;
    }
    if (!parent) throw new Error('Container not found');
    return parent;
  }

  private initEvents(): void {
    const getPos = (e: MouseEvent): [number, number] => {
      const rect = this.wrapper.getBoundingClientRect();
      return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height];
    };
    this.wrapper.addEventListener('click', (e) => { const [x, y] = getPos(e); this.emit('click', x, y); });
    this.wrapper.addEventListener('dblclick', (e) => { const [x, y] = getPos(e); this.emit('dblclick', x, y); });

    if (this.options.dragToSeek === true || typeof this.options.dragToSeek === 'object') this.initDrag();

    this.scrollContainer.addEventListener('scroll', () => {
      const { scrollLeft, scrollWidth, clientWidth } = this.scrollContainer;
      this.emit('scroll', scrollLeft / scrollWidth, (scrollLeft + clientWidth) / scrollWidth, scrollLeft, scrollLeft + clientWidth);
    });

    if (typeof ResizeObserver === 'function') {
      const delay = this.createDelay(100);
      this.resizeObserver = new ResizeObserver(() => { delay().then(() => this.onContainerResize()).catch(() => undefined); });
      this.resizeObserver.observe(this.scrollContainer);
    }
  }

  private onContainerResize(): void {
    const width = this.parent.clientWidth;
    if (width === this.lastContainerWidth && this.options.height !== 'auto') return;
    this.lastContainerWidth = width;
    this.reRender();
  }

  private initDrag(): void {
    const w = () => this.wrapper.getBoundingClientRect().width;
    this.subscriptions.push(
      makeDraggable(
        this.wrapper,
        (_, __, x) => this.emit('drag', Math.max(0, Math.min(1, x / w()))),
        (x) => { this.isDragging = true; this.emit('dragstart', Math.max(0, Math.min(1, x / w()))); },
        (x) => { this.isDragging = false; this.emit('dragend', Math.max(0, Math.min(1, x / w()))); }
      )
    );
  }

  private getHeight(optionsHeight?: WaveSurferOptions['height'], optionsSplitChannel?: WaveSurferOptions['splitChannels']): number {
    const defaultHeight = 128;
    const numChannels = this.audioData?.numberOfChannels || 1;
    if (optionsHeight == null) return defaultHeight;
    if (!isNaN(Number(optionsHeight))) return Number(optionsHeight);
    if (optionsHeight === 'auto') {
      const h = this.parent.clientHeight || defaultHeight;
      return optionsSplitChannel?.every(c => !c.overlay) ? h / numChannels : h;
    }
    return defaultHeight;
  }

  private getPixelRatio(): number { return Math.max(1, this.iframeWindow.devicePixelRatio || 1); }

  /** Wavesurfer itself calls this method. Do not call it manually. */
  setOptions(options: WaveSurferOptions): void {
    this.iframeWindow = options.iframeWindow || window;
    this.iframeDocument = options.iframeDocument || document;
    if (this.options.container !== options.container) {
      const newParent = this.parentFromOptionsContainer(options.container);
      newParent.appendChild(this.container);
      this.parent = newParent;
    }
    if (options.dragToSeek === true || typeof this.options.dragToSeek === 'object') this.initDrag();
    this.options = options;
    this.reRender();
  }

  getWrapper(): HTMLElement { return this.wrapper; }
  getWidth(): number { return this.scrollContainer.clientWidth; }
  getScroll(): number { return this.scrollContainer.scrollLeft; }
  setScroll(pixels: number): void { this.scrollContainer.scrollLeft = pixels; }
  setScrollPercentage(percent: number): void { this.setScroll(this.scrollContainer.scrollWidth * percent); }

  destroy(): void {
    this.subscriptions.forEach(u => u());
    this.container.remove();
    this.resizeObserver?.disconnect();
    this.unsubscribeOnScroll?.();
  }

  private createDelay(delayMs = 10): () => Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let reject: (() => void) | undefined;
    const onClear = () => { if (timeout) clearTimeout(timeout); if (reject) reject(); };
    this.timeouts.push(onClear);
    return () => new Promise((res, rej) => {
      onClear(); reject = rej;
      timeout = setTimeout(() => { timeout = undefined; reject = undefined; res(); }, delayMs);
    });
  }

  private renderSingleCanvas(
    data: Array<Float32Array | number[]>, options: WaveSurferOptions,
    width: number, height: number, offset: number,
    canvasContainer: HTMLElement, progressContainer: HTMLElement
  ): void {
    const pr = this.getPixelRatio();
    const canvas = this.iframeDocument.createElement('canvas');
    canvas.width = Math.round(width * pr); canvas.height = Math.round(height * pr);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    canvas.style.left = `${Math.round(offset)}px`;
    canvasContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    renderWaveform(data, options, ctx, convertColorValues(options.waveColor, this.iframeDocument, this.iframeWindow), pr);

    if (canvas.width > 0 && canvas.height > 0) {
      const progressCanvas = canvas.cloneNode() as HTMLCanvasElement;
      const pCtx = progressCanvas.getContext('2d') as CanvasRenderingContext2D;
      pCtx.drawImage(canvas, 0, 0);
      pCtx.globalCompositeOperation = 'source-in';
      pCtx.fillStyle = convertColorValues(options.progressColor, this.iframeDocument, this.iframeWindow);
      pCtx.fillRect(0, 0, canvas.width, canvas.height);
      progressContainer.appendChild(progressCanvas);
    }
  }

  private renderMultiCanvas(
    channelData: Array<Float32Array | number[]>, options: WaveSurferOptions,
    width: number, height: number, canvasContainer: HTMLElement, progressContainer: HTMLElement
  ): void {
    const pr = this.getPixelRatio();
    const { clientWidth } = this.scrollContainer;
    const totalWidth = width / pr;
    let singleW = Math.min(Renderer.MAX_CANVAS_WIDTH, clientWidth, totalWidth);
    let drawn: Record<number, boolean> = {};

    if (options.barWidth || options.barGap) {
      const bw = options.barWidth || 0.5, bg = options.barGap || bw / 2, total = bw + bg;
      if (singleW % total !== 0) singleW = Math.floor(singleW / total) * total;
    }

    const numCanvases = Math.ceil(totalWidth / singleW);
    const draw = (index: number) => {
      if (index < 0 || index >= numCanvases || drawn[index]) return;
      drawn[index] = true;
      const offset = index * singleW;
      const cw = Math.min(totalWidth - offset, singleW);
      if (cw <= 0) return;
      const data = channelData.map(ch => ch.slice(Math.floor(offset / totalWidth * ch.length), Math.floor((offset + cw) / totalWidth * ch.length)));
      this.renderSingleCanvas(data, options, cw, height, offset, canvasContainer, progressContainer);
    };
    const clearCanvases = () => {
      if (Object.keys(drawn).length > Renderer.MAX_NODES) { canvasContainer.innerHTML = ''; progressContainer.innerHTML = ''; drawn = {}; }
    };

    if (!this.isScrollable) { for (let i = 0; i < numCanvases; i++) draw(i); return; }

    const startCanvas = Math.floor(this.scrollContainer.scrollLeft / totalWidth * numCanvases);
    draw(startCanvas - 1); draw(startCanvas); draw(startCanvas + 1);

    if (numCanvases > 1) {
      this.unsubscribeOnScroll = this.on('scroll', () => {
        const ci = Math.floor(this.scrollContainer.scrollLeft / totalWidth * numCanvases);
        clearCanvases(); draw(ci - 1); draw(ci); draw(ci + 1);
      });
    }
  }

  private renderChannel(channelData: Array<Float32Array | number[]>, { overlay, ...options }: WaveSurferOptions & { overlay?: boolean }, width: number, channelIndex: number): void {
    const canvasContainer = this.iframeDocument.createElement('div');
    const height = this.getHeight(options.height, options.splitChannels);
    canvasContainer.style.height = `${height}px`;
    if (overlay && channelIndex > 0) canvasContainer.style.marginTop = `-${height}px`;
    this.canvasWrapper.style.minHeight = `${height}px`;
    this.canvasWrapper.appendChild(canvasContainer);
    const progressContainer = canvasContainer.cloneNode() as HTMLElement;
    this.progressWrapper.appendChild(progressContainer);
    this.renderMultiCanvas(channelData, options, width, height, canvasContainer, progressContainer);
  }

  async render(audioData: AudioBuffer): Promise<void> {
    this.timeouts.forEach(c => c()); this.timeouts = [];
    this.canvasWrapper.innerHTML = ''; this.progressWrapper.innerHTML = '';

    if (this.options.width != null) {
      this.scrollContainer.style.width = typeof this.options.width === 'number' ? `${this.options.width}px` : this.options.width;
    }

    const pr = this.getPixelRatio();
    const parentWidth = this.scrollContainer.clientWidth;
    const scrollWidth = Math.ceil(audioData.duration * (this.options.minPxPerSec || 0));
    this.isScrollable = scrollWidth > parentWidth;
    const useParentWidth = this.options.fillParent && !this.isScrollable;
    const width = (useParentWidth ? parentWidth : scrollWidth) * pr;

    this.wrapper.style.width = useParentWidth ? '100%' : `${scrollWidth}px`;
    this.scrollContainer.style.overflowX = this.isScrollable ? 'auto' : 'hidden';
    this.scrollContainer.classList.toggle('noScrollbar', !!this.options.hideScrollbar);
    this.cursor.style.backgroundColor = `${this.options.cursorColor || this.options.progressColor}`;
    this.cursor.style.width = `${this.options.cursorWidth}px`;
    this.audioData = audioData;
    this.emit('render');

    if (this.options.splitChannels) {
      for (let i = 0; i < audioData.numberOfChannels; i++) {
        const opts = { ...this.options, ...this.options.splitChannels?.[i] };
        this.renderChannel([audioData.getChannelData(i)], opts, width, i);
      }
    } else {
      const channels: Float32Array[] = [audioData.getChannelData(0)];
      if (audioData.numberOfChannels > 1) channels.push(audioData.getChannelData(1));
      this.renderChannel(channels, this.options, width, 0);
    }

    Promise.resolve().then(() => this.emit('rendered'));
  }

  reRender(): void {
    this.unsubscribeOnScroll?.(); delete this.unsubscribeOnScroll;
    if (!this.audioData) return;
    const { scrollWidth } = this.scrollContainer;
    const { right: before } = this.progressWrapper.getBoundingClientRect();
    this.render(this.audioData);
    if (this.isScrollable && scrollWidth !== this.scrollContainer.scrollWidth) {
      const { right: after } = this.progressWrapper.getBoundingClientRect();
      let delta = after - before; delta *= 2;
      delta = delta < 0 ? Math.floor(delta) : Math.ceil(delta); delta /= 2;
      this.scrollContainer.scrollLeft += delta;
    }
  }

  zoom(minPxPerSec: number): void { this.options.minPxPerSec = minPxPerSec; this.reRender(); }

  renderProgress(progress: number, isPlaying?: boolean): void {
    if (isNaN(progress)) return;
    const pct = progress * 100;
    this.canvasWrapper.style.clipPath = `polygon(${pct}% 0, 100% 0, 100% 100%, ${pct}% 100%)`;
    this.progressWrapper.style.width = `${pct}%`;
    this.cursor.style.left = `${pct}%`;
    this.cursor.style.transform = `translateX(-${Math.round(pct) === 100 ? this.options.cursorWidth : 0}px)`;
    if (this.isScrollable && this.options.autoScroll) {
      scrollIntoView(this.scrollContainer, progress, !!isPlaying, this.isDragging, !!this.options.autoCenter,
        (s, e, l, r) => this.emit('scroll', s, e, l, r));
    }
  }

  async exportImage(format: string, quality: number, type: 'dataURL' | 'blob'): Promise<string[] | Blob[]> {
    const canvases = this.canvasWrapper.querySelectorAll('canvas');
    if (!canvases.length) throw new Error('No waveform data');
    if (type === 'dataURL') return Array.from(canvases).map(c => c.toDataURL(format, quality));
    return Promise.all(Array.from(canvases).map(c => new Promise<Blob>((res, rej) => {
      c.toBlob(b => b ? res(b) : rej(new Error('Could not export image')), format, quality);
    })));
  }
}

export default Renderer;
