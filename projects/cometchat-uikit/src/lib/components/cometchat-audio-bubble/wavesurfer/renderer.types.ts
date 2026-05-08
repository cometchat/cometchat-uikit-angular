/**
 * Types for the Renderer class.
 */

export type RendererEvents = {
  click: [relativeX: number, relativeY: number];
  dblclick: [relativeX: number, relativeY: number];
  drag: [relativeX: number];
  dragstart: [relativeX: number];
  dragend: [relativeX: number];
  scroll: [
    relativeStart: number,
    relativeEnd: number,
    scrollLeft: number,
    scrollRight: number
  ];
  render: [];
  rendered: [];
};
