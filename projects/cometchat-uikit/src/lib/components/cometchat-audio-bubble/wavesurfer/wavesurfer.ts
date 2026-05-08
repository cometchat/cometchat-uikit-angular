/**
 * WaveSurfer
 *
 * Main WaveSurfer class for audio waveform visualization.
 * Adapted from WaveSurfer library for Angular compatibility.
 *
 * @see Requirements 14.1, 14.2, 14.3
 */

import BasePlugin, { type GenericPlugin } from './base-plugin';
import Decoder from './decoder';
import * as dom from './dom';
import Fetcher from './fetcher';
import Player from './player';
import Renderer from './renderer';
import Timer from './timer';
import WebAudioPlayer from './webaudio';
import type { WaveSurferOptions, WaveSurferEvents } from './wavesurfer.types';

// Re-export types for backward compatibility
export type { WaveSurferOptions, WaveSurferEvents } from './wavesurfer.types';

const defaultOptions = {
  waveColor: '#999',
  progressColor: '#555',
  cursorWidth: 1,
  minPxPerSec: 0,
  fillParent: true,
  interact: true,
  dragToSeek: false,
  autoScroll: true,
  autoCenter: true,
  sampleRate: 8000,
};

class WaveSurfer extends Player<WaveSurferEvents> {
  public options: WaveSurferOptions & typeof defaultOptions;
  private renderer: Renderer;
  private timer: Timer;
  private plugins: GenericPlugin[] = [];
  private decodedData: AudioBuffer | null = null;
  protected subscriptions: Array<() => void> = [];
  protected mediaSubscriptions: Array<() => void> = [];
  protected abortController: AbortController | null = null;

  public static readonly BasePlugin = BasePlugin;
  public static readonly dom = dom;

  /** Create a new WaveSurfer instance */
  public static create(options: WaveSurferOptions): WaveSurfer {
    return new WaveSurfer(options);
  }

  constructor(options: WaveSurferOptions) {
    const media =
      options.media ||
      (options.backend === 'WebAudio' ? (new WebAudioPlayer() as unknown as HTMLAudioElement) : undefined);

    super({ media, mediaControls: options.mediaControls, autoplay: options.autoplay, playbackRate: options.audioRate });

    this.options = Object.assign({}, defaultOptions, options);
    this.timer = new Timer();

    const audioElement = media ? undefined : this.getMediaElement();
    this.renderer = new Renderer(this.options, audioElement, this.options.iframeDocument, this.options.iframeWindow);

    this.initPlayerEvents();
    this.initRendererEvents();
    this.initTimerEvents();
    this.initPlugins();

    const initialUrl = this.options.url || this.getSrc() || '';
    Promise.resolve().then(() => {
      this.emit('init');
      const { peaks, duration } = this.options;
      if (initialUrl || (peaks && duration)) {
        this.load(initialUrl, peaks, duration).catch(() => null);
      }
    });
  }

  private updateProgress(currentTime = this.getCurrentTime()): number {
    this.renderer.renderProgress(currentTime / this.getDuration(), this.isPlaying());
    return currentTime;
  }

  private initTimerEvents(): void {
    this.subscriptions.push(
      this.timer.on('tick', () => {
        if (!this.isSeeking()) {
          const t = this.updateProgress();
          this.emit('timeupdate', t);
          this.emit('audioprocess', t);
        }
      })
    );
  }

  private initPlayerEvents(): void {
    if (this.isPlaying()) { this.emit('play'); this.timer.start(); }
    this.mediaSubscriptions.push(
      this.onMediaEvent('timeupdate', () => { const t = this.updateProgress(); this.emit('timeupdate', t); }),
      this.onMediaEvent('play', () => { this.emit('play'); this.timer.start(); }),
      this.onMediaEvent('pause', () => { this.emit('pause'); this.timer.stop(); }),
      this.onMediaEvent('emptied', () => { this.timer.stop(); }),
      this.onMediaEvent('ended', () => { this.emit('finish'); }),
      this.onMediaEvent('seeking', () => { this.emit('seeking', this.getCurrentTime()); }),
      this.onMediaEvent('error', (err) => { this.emit('error', (err as any).error); })
    );
  }

  private initRendererEvents(): void {
    this.subscriptions.push(
      this.renderer.on('click', (x, y) => {
        if (this.options.interact) { this.seekTo(x); this.emit('interaction', x * this.getDuration()); this.emit('click', x, y); }
      }),
      this.renderer.on('dblclick', (x, y) => { this.emit('dblclick', x, y); }),
      this.renderer.on('scroll', (sx, ex, sl, sr) => { const d = this.getDuration(); this.emit('scroll', sx * d, ex * d, sl, sr); }),
      this.renderer.on('render', () => { this.emit('redraw'); }),
      this.renderer.on('rendered', () => { this.emit('redrawcomplete'); }),
      this.renderer.on('dragstart', (x) => { this.emit('dragstart', x); }),
      this.renderer.on('dragend', (x) => { this.emit('dragend', x); })
    );

    // Drag with debounce
    let debounce: ReturnType<typeof setTimeout>;
    this.subscriptions.push(
      this.renderer.on('drag', (x) => {
        if (!this.options.interact) return;
        this.renderer.renderProgress(x);
        clearTimeout(debounce);
        let debounceTime = 0;
        if (!this.isPlaying()) {
          if (this.options.dragToSeek === true) debounceTime = 200;
          else if (typeof this.options.dragToSeek === 'object') debounceTime = this.options.dragToSeek['debounceTime'];
        }
        debounce = setTimeout(() => { this.seekTo(x); }, debounceTime);
        this.emit('interaction', x * this.getDuration());
        this.emit('drag', x);
      })
    );
  }

  private initPlugins(): void {
    if (!this.options.plugins?.length) return;
    this.options.plugins.forEach(p => this.registerPlugin(p));
  }

  private unsubscribePlayerEvents(): void {
    this.mediaSubscriptions.forEach(u => u());
    this.mediaSubscriptions = [];
  }

  /** Set new wavesurfer options and re-render it */
  public setOptions(options: Partial<WaveSurferOptions>): void {
    this.options = Object.assign({}, this.options, options);
    this.renderer.setOptions(this.options);
    if (options.audioRate) this.setPlaybackRate(options.audioRate);
    if (options.mediaControls != null) this.getMediaElement().controls = options.mediaControls;
  }

  /** Register a wavesurfer plugin */
  public registerPlugin<T extends GenericPlugin>(plugin: T): T {
    plugin._init(this);
    this.plugins.push(plugin);
    this.subscriptions.push(plugin.once('destroy', () => { this.plugins = this.plugins.filter(p => p !== plugin); }));
    return plugin;
  }

  public getWrapper(): HTMLElement { return this.renderer.getWrapper(); }
  public getWidth(): number { return this.renderer.getWidth(); }
  public getScroll(): number { return this.renderer.getScroll(); }
  public setScroll(pixels: number): void { this.renderer.setScroll(pixels); }
  public setScrollTime(time: number): void { this.renderer.setScrollPercentage(time / this.getDuration()); }
  public getActivePlugins(): GenericPlugin[] { return this.plugins; }

  private async loadAudio(url: string, blob?: Blob, channelData?: WaveSurferOptions['peaks'], duration?: number): Promise<void> {
    this.emit('load', url);
    if (!this.options.media && this.isPlaying()) this.pause();
    this.decodedData = null;

    if (!blob && !channelData) {
      const fetchParams = this.options.fetchParams || {};
      if (window.AbortController && !fetchParams.signal) {
        this.abortController = new AbortController();
        fetchParams.signal = this.abortController?.signal;
      }
      blob = await Fetcher.fetchBlob(url, (pct) => this.emit('loading', pct), fetchParams);
    }

    this.setSrc(url, blob);

    const audioDuration = await new Promise<number>(resolve => {
      const staticDuration = duration || this.getDuration();
      if (staticDuration) { resolve(staticDuration); return; }
      this.mediaSubscriptions.push(this.onMediaEvent('loadedmetadata', () => resolve(this.getDuration()), { once: true }));
    });

    if (!url && !blob) {
      const media = this.getMediaElement();
      if (media instanceof WebAudioPlayer) media.duration = audioDuration;
    }

    if (channelData) {
      this.decodedData = Decoder.createBuffer(channelData, audioDuration || 0);
    } else if (blob) {
      this.decodedData = await Decoder.decode(await blob.arrayBuffer(), this.options.sampleRate);
    }

    if (this.decodedData) { this.emit('decode', this.getDuration()); this.renderer.render(this.decodedData); }
    this.emit('ready', this.getDuration());
  }

  public async load(url: string, channelData?: WaveSurferOptions['peaks'], duration?: number): Promise<void> {
    try { return await this.loadAudio(url, undefined, channelData, duration); }
    catch (err) { this.emit('error', err as Error); throw err; }
  }

  public async loadBlob(blob: Blob, channelData?: WaveSurferOptions['peaks'], duration?: number): Promise<void> {
    try { return await this.loadAudio('', blob, channelData, duration); }
    catch (err) { this.emit('error', err as Error); throw err; }
  }

  public zoom(minPxPerSec: number): void {
    if (!this.decodedData) throw new Error('No audio loaded');
    this.renderer.zoom(minPxPerSec);
    this.emit('zoom', minPxPerSec);
  }

  public getDecodedData(): AudioBuffer | null { return this.decodedData; }

  public exportPeaks({ channels = 2, maxLength = 8000, precision = 10_000 } = {}): Array<number[]> {
    if (!this.decodedData) throw new Error('The audio has not been decoded yet');
    const maxChannels = Math.min(channels, this.decodedData.numberOfChannels);
    const peaks = [];
    for (let i = 0; i < maxChannels; i++) {
      const channel = this.decodedData.getChannelData(i);
      const sampleSize = channel.length / maxLength;
      const data = Array.from({ length: maxLength }, (_, j) => {
        const sample = channel.slice(Math.floor(j * sampleSize), Math.ceil((j + 1) * sampleSize));
        let max = 0;
        for (let x = 0; x < sample.length; x++) { if (Math.abs(sample[x]) > Math.abs(max)) max = sample[x]; }
        return Math.round(max * precision) / precision;
      });
      peaks.push(data);
    }
    return peaks;
  }

  public override getDuration(): number {
    let d = super.getDuration() || 0;
    if ((d === 0 || d === Infinity) && this.decodedData) d = this.decodedData.duration;
    return d;
  }

  public toggleInteraction(isInteractive: boolean): void { this.options.interact = isInteractive; }

  public override setTime(time: number): void {
    super.setTime(time);
    this.updateProgress(time);
    this.emit('timeupdate', time);
  }

  public seekTo(progress: number): void { this.setTime(this.getDuration() * progress); }
  public async playPause(): Promise<void> { return this.isPlaying() ? this.pause() : this.play(); }
  public stop(): void { this.pause(); this.setTime(0); }
  public skip(seconds: number): void { this.setTime(this.getCurrentTime() + seconds); }
  public empty(): void { this.load('', [[0]], 0.001); }

  public override setMediaElement(element: HTMLMediaElement): void {
    this.unsubscribePlayerEvents();
    super.setMediaElement(element);
    this.initPlayerEvents();
  }

  public async exportImage(format: string, quality: number, type: 'dataURL'): Promise<string[]>;
  public async exportImage(format: string, quality: number, type: 'blob'): Promise<Blob[]>;
  public async exportImage(format = 'image/png', quality = 1, type: 'dataURL' | 'blob' = 'dataURL'): Promise<string[] | Blob[]> {
    return this.renderer.exportImage(format, quality, type);
  }

  public override destroy(): void {
    this.emit('destroy');
    this.abortController?.abort();
    this.plugins.forEach(p => p.destroy());
    this.subscriptions.forEach(u => u());
    this.unsubscribePlayerEvents();
    this.timer.destroy();
    this.renderer.destroy();
    super.destroy();
  }
}

export default WaveSurfer;
