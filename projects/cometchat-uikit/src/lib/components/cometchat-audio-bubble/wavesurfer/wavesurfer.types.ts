/**
 * Types for WaveSurfer — options, events, and color helpers.
 */

import type { GenericPlugin } from './base-plugin';

export type WaveSurferColor = string | string[] | CanvasGradient;

export type WaveSurferOptions = {
  /** Required: an HTML element or selector where the waveform will be rendered */
  container: HTMLElement | string;
  /** The height of the waveform in pixels, or "auto" to fill the container height */
  height?: number | 'auto';
  /** The width of the waveform in pixels or any CSS value; defaults to 100% */
  width?: number | string;
  /** The color of the waveform */
  waveColor?: WaveSurferColor;
  /** The color of the progress mask */
  progressColor?: WaveSurferColor;
  /** The color of the playback cursor */
  cursorColor?: string;
  /** The cursor width */
  cursorWidth?: number;
  /** If set, the waveform will be rendered with bars */
  barWidth?: number;
  /** Spacing between bars in pixels */
  barGap?: number;
  /** Rounded borders for bars */
  barRadius?: number;
  /** A vertical scaling factor for the waveform */
  barHeight?: number;
  /** Vertical bar alignment */
  barAlign?: 'top' | 'bottom';
  /** Minimum pixels per second of audio (i.e. the zoom level) */
  minPxPerSec?: number;
  /** Stretch the waveform to fill the container, true by default */
  fillParent?: boolean;
  /** Audio URL */
  url?: string;
  /** Pre-computed audio data, arrays of floats for each channel */
  peaks?: Array<Float32Array | number[]>;
  /** Pre-computed audio duration in seconds */
  duration?: number;
  /** Use an existing media element instead of creating one */
  media?: HTMLMediaElement;
  /** Whether to show default audio element controls */
  mediaControls?: boolean;
  /** Play the audio on load */
  autoplay?: boolean;
  /** Pass false to disable clicks on the waveform */
  interact?: boolean;
  /** Allow to drag the cursor to seek to a new position */
  dragToSeek?: boolean | { debounceTime: number };
  /** Hide the scrollbar */
  hideScrollbar?: boolean;
  /** Audio rate, i.e. the playback speed */
  audioRate?: number;
  /** Automatically scroll the container to keep the current position in viewport */
  autoScroll?: boolean;
  /** If autoScroll is enabled, keep the cursor in the center of the waveform during playback */
  autoCenter?: boolean;
  /** Decoding sample rate. Doesn't affect the playback. Defaults to 8000 */
  sampleRate?: number;
  /** Render each audio channel as a separate waveform */
  splitChannels?: Array<Partial<WaveSurferOptions> & { overlay?: boolean }>;
  /** Stretch the waveform to the full height */
  normalize?: boolean;
  /** The list of plugins to initialize on start */
  plugins?: GenericPlugin[];
  /** Custom render function */
  renderFunction?: (peaks: Array<Float32Array | number[]>, ctx: CanvasRenderingContext2D) => void;
  /** Options to pass to the fetch method */
  fetchParams?: RequestInit;
  /** Playback "backend" to use, defaults to MediaElement */
  backend?: 'WebAudio' | 'MediaElement';
  /** Nonce for CSP if necessary */
  cspNonce?: string;
  /** iframe document for iframe context support */
  iframeDocument?: Document;
  /** iframe window for iframe context support */
  iframeWindow?: Window;
};

export type WaveSurferEvents = {
  /** After wavesurfer is created */
  init: [];
  /** When audio starts loading */
  load: [url: string];
  /** During audio loading */
  loading: [percent: number];
  /** When the audio has been decoded */
  decode: [duration: number];
  /** When the audio is both decoded and can play */
  ready: [duration: number];
  /** When visible waveform is drawn */
  redraw: [];
  /** When all audio channel chunks of the waveform have drawn */
  redrawcomplete: [];
  /** When the audio starts playing */
  play: [];
  /** When the audio pauses */
  pause: [];
  /** When the audio finishes playing */
  finish: [];
  /** On audio position change, fires continuously during playback */
  timeupdate: [currentTime: number];
  /** An alias of timeupdate but only when the audio is playing */
  audioprocess: [currentTime: number];
  /** When the user seeks to a new position */
  seeking: [currentTime: number];
  /** When the user interacts with the waveform (i.g. clicks or drags on it) */
  interaction: [newTime: number];
  /** When the user clicks on the waveform */
  click: [relativeX: number, relativeY: number];
  /** When the user double-clicks on the waveform */
  dblclick: [relativeX: number, relativeY: number];
  /** When the user drags the cursor */
  drag: [relativeX: number];
  /** When the user starts dragging the cursor */
  dragstart: [relativeX: number];
  /** When the user ends dragging the cursor */
  dragend: [relativeX: number];
  /** When the waveform is scrolled (panned) */
  scroll: [visibleStartTime: number, visibleEndTime: number, scrollLeft: number, scrollRight: number];
  /** When the zoom level changes */
  zoom: [minPxPerSec: number];
  /** Just before the waveform is destroyed so you can clean up your events */
  destroy: [];
  /** When source file is unable to be fetched, decoded, or an error is thrown by media element */
  error: [error: Error];
};
