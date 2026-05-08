/**
 * Pure utility functions for the Renderer class.
 * Extracted to keep renderer.ts under 400 lines.
 */

import type { WaveSurferOptions } from './wavesurfer';

// ─── Color / Gradient ─────────────────────────────────────────────────────────

/**
 * Convert an array of color strings to a linear CanvasGradient,
 * or return the value as-is if it is already a string/gradient.
 */
export function convertColorValues(
  color: WaveSurferOptions['waveColor'],
  iframeDocument: Document,
  iframeWindow: Window
): string | CanvasGradient {
  if (!Array.isArray(color)) return color || '';
  if (color.length < 2) return color[0] || '';

  const canvas = iframeDocument.createElement('canvas');
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const gradientHeight = canvas.height * (iframeWindow.devicePixelRatio || 1);
  const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight);
  const step = 1 / (color.length - 1);
  color.forEach((c, i) => gradient.addColorStop(i * step, c));
  return gradient;
}

// ─── Waveform Rendering ───────────────────────────────────────────────────────

export function renderBarWaveform(
  channelData: Array<Float32Array | number[]>,
  options: WaveSurferOptions,
  ctx: CanvasRenderingContext2D,
  vScale: number,
  pixelRatio: number
): void {
  const topChannel = channelData[0];
  const bottomChannel = channelData[1] || channelData[0];
  const length = topChannel.length;
  const { width, height } = ctx.canvas;
  const halfHeight = height / 2;

  const barWidth = options.barWidth ? options.barWidth * pixelRatio : 1;
  const barGap = options.barGap ? options.barGap * pixelRatio : options.barWidth ? barWidth / 2 : 0;
  const barRadius = options.barRadius || 0;
  const barIndexScale = width / (barWidth + barGap) / length;
  const rectFn = barRadius && 'roundRect' in ctx ? 'roundRect' : 'rect';

  ctx.beginPath();
  let prevX = 0, maxTop = 0, maxBottom = 0;

  for (let i = 0; i <= length; i++) {
    const x = Math.round(i * barIndexScale);
    if (x > prevX) {
      const topH = Math.round(maxTop * halfHeight * vScale);
      const botH = Math.round(maxBottom * halfHeight * vScale);
      const barH = topH + botH || 1;
      let y = halfHeight - topH;
      if (options.barAlign === 'top') y = 0;
      else if (options.barAlign === 'bottom') y = height - barH;
      (ctx as any)[rectFn](prevX * (barWidth + barGap), y, barWidth, barH, barRadius);
      prevX = x; maxTop = 0; maxBottom = 0;
    }
    const mt = Math.abs(topChannel[i] || 0);
    const mb = Math.abs(bottomChannel[i] || 0);
    if (mt > maxTop) maxTop = mt;
    if (mb > maxBottom) maxBottom = mb;
  }
  ctx.fill();
  ctx.closePath();
}

export function renderLineWaveform(
  channelData: Array<Float32Array | number[]>,
  ctx: CanvasRenderingContext2D,
  vScale: number
): void {
  const drawChannel = (index: number) => {
    const channel = channelData[index] || channelData[0];
    const { height } = ctx.canvas;
    const halfHeight = height / 2;
    const hScale = ctx.canvas.width / channel.length;
    ctx.moveTo(0, halfHeight);
    let prevX = 0, max = 0;
    for (let i = 0; i <= channel.length; i++) {
      const x = Math.round(i * hScale);
      if (x > prevX) {
        const h = Math.round(max * halfHeight * vScale) || 1;
        ctx.lineTo(prevX, halfHeight + h * (index === 0 ? -1 : 1));
        prevX = x; max = 0;
      }
      const v = Math.abs(channel[i] || 0);
      if (v > max) max = v;
    }
    ctx.lineTo(prevX, halfHeight);
  };
  ctx.beginPath();
  drawChannel(0);
  drawChannel(1);
  ctx.fill();
  ctx.closePath();
}

export function renderWaveform(
  channelData: Array<Float32Array | number[]>,
  options: WaveSurferOptions,
  ctx: CanvasRenderingContext2D,
  colorValue: string | CanvasGradient,
  pixelRatio: number
): void {
  ctx.fillStyle = colorValue;

  if (options.renderFunction) { options.renderFunction(channelData, ctx); return; }

  let vScale = options.barHeight || 1;
  if (options.normalize) {
    const max = Array.from(channelData[0]).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    vScale = max ? 1 / max : 1;
  }

  if (options.barWidth || options.barGap || options.barAlign) {
    renderBarWaveform(channelData, options, ctx, vScale, pixelRatio);
  } else {
    renderLineWaveform(channelData, ctx, vScale);
  }
}

// ─── HTML Template ────────────────────────────────────────────────────────────

export function buildRendererHtml(
  minHeight: number,
  cspNonce: string | undefined,
  iframeDocument: Document
): [HTMLElement, ShadowRoot] {
  const div = iframeDocument.createElement('div');
  const shadow = div.attachShadow({ mode: 'open' });
  const nonce = cspNonce && typeof cspNonce === 'string' ? cspNonce.replace(/"/g, '') : '';

  shadow.innerHTML = `
    <style${nonce ? ` nonce="${nonce}"` : ''}>
      :host { user-select: none; min-width: 1px; }
      :host audio { display: block; width: 100%; }
      :host .scroll { overflow-x: auto; overflow-y: hidden; width: 100%; position: relative; }
      :host .noScrollbar { scrollbar-color: transparent; scrollbar-width: none; }
      :host .noScrollbar::-webkit-scrollbar { display: none; -webkit-appearance: none; }
      :host .wrapper { position: relative; overflow: visible; z-index: 2; }
      :host .canvases { min-height: ${minHeight}px; }
      :host .canvases > div { position: relative; }
      :host canvas { display: block; position: absolute; top: 0; image-rendering: pixelated; }
      :host .progress { pointer-events: none; position: absolute; z-index: 2; top: 0; left: 0; width: 0; height: 100%; overflow: hidden; }
      :host .progress > div { position: relative; }
      :host .cursor { pointer-events: none; position: absolute; z-index: 5; top: 0; left: 0; height: 100%; border-radius: 2px; }
    </style>
    <div class="scroll" part="scroll">
      <div class="wrapper" part="wrapper">
        <div class="canvases" part="canvases"></div>
        <div class="progress" part="progress"></div>
        <div class="cursor" part="cursor"></div>
      </div>
    </div>
  `;
  return [div, shadow];
}

// ─── Scroll Into View ─────────────────────────────────────────────────────────

export function scrollIntoView(
  scrollContainer: HTMLElement,
  progress: number,
  isPlaying: boolean,
  isDragging: boolean,
  autoCenter: boolean,
  emitScroll: (startX: number, endX: number, scrollLeft: number, scrollRight: number) => void
): void {
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
  const progressWidth = progress * scrollWidth;
  const middle = clientWidth / 2;

  if (isDragging) {
    const minGap = 30;
    if (progressWidth + minGap > scrollLeft + clientWidth) scrollContainer.scrollLeft += minGap;
    else if (progressWidth - minGap < scrollLeft) scrollContainer.scrollLeft -= minGap;
  } else {
    if (progressWidth < scrollLeft || progressWidth > scrollLeft + clientWidth) {
      scrollContainer.scrollLeft = progressWidth - (autoCenter ? middle : 0);
    }
    const center = progressWidth - scrollContainer.scrollLeft - middle;
    if (isPlaying && autoCenter && center > 0) scrollContainer.scrollLeft += Math.min(center, 10);
  }

  const newScroll = scrollContainer.scrollLeft;
  emitScroll(newScroll / scrollWidth, (newScroll + clientWidth) / scrollWidth, newScroll, newScroll + clientWidth);
}
