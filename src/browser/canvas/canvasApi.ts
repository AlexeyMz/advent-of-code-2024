import * as React from 'react';

import { Events, PropertyChange } from './events';

import { Vector, Rect, Size } from './geometry';
import type { PaperTransform } from './paper';

/**
 * Describes an API to interact with a scrollable graph canvas.
 *
 * @category Core
 */
export interface CanvasApi {
    /**
     * Events for the scrollable graph canvas.
     */
    readonly events: Events<CanvasEvents>;
    /**
     * Live state for the current viewport size and transformation.
     *
     * Allows to convert between different canvas coordinate types.
     *
     * This state can be captured to provide freezed state via `CanvasMetrics.snapshot()`.
     */
    readonly metrics: CanvasMetrics;
    /**
     * Options for the scale-affecting operations on the canvas.
     */
    readonly zoomOptions: Required<ZoomOptions>;
    /**
     * Default action on moving pointer with pressed main button.
     *
     * Initial mode is `panning`.
     */
    readonly pointerMode: CanvasPointerMode;
    /**
     * TODO
     */
    scheduleAdjustArea(): void;
    /**
     * TODO
     */
    forceAdjustArea(): void;
    /**
     * Sets default action on moving pointer with pressed main button.
     */
    setPointerMode(value: CanvasPointerMode): void;
    /**
     * Changes the viewport such that its center is aligned to specified point
     * in paper coordinates.
     *
     * If no point is specified, aligns the viewport center with the canvas center instead.
     */
    centerTo(
        paperPosition?: Vector,
        options?: CenterToOptions
    ): Promise<void>;
    /**
     * Changes the viewport such that center of the bounding box for the graph content
     * is aligned to the viewport center.
     */
    centerContent(options?: ViewportOptions): Promise<void>;
    /**
     * Returns the current scale of the graph content in relation to the viewport.
     */
    getScale(): number;
    /**
     * Changes the viewport to set specific scale of the graph content.
     *
     * If `pivot` is specified, the viewport is changed as if the canvas was
     * zoomed-in or zoomed-out at that point of the canvas
     * (e.g. by mouse wheel or pinch-zoom at the pivot).
     */
    setScale(value: number, options?: ScaleOptions): Promise<void>;
    /**
     * Same as `setScale()` but relative to the current scale value.
     *
     * @see CanvasApi.setScale()
     */
    zoomBy(value: number, options?: ScaleOptions): Promise<void>;
    /**
     * Same as `zoomBy()` with a positive zoom step value.
     *
     * @see CanvasApi.zoomBy()
     */
    zoomIn(scaleOptions?: ScaleOptions): Promise<void>;
    /**
     * Same as `zoomBy()` with a negative zoom step value.
     *
     * @see CanvasApi.zoomBy()
     */
    zoomOut(scaleOptions?: ScaleOptions): Promise<void>;
    /**
     * Changes the viewport to fit the whole graph content if possible.
     *
     * If the diagram is empty, centers the viewport at the middle of the canvas.
     *
     * @see CanvasApi.zoomToFitRect()
     */
    zoomToFit(options?: ViewportOptions): Promise<void>;
    /**
     * Changes the viewport to fit specified rectangle area in paper coordinates if possible.
     *
     * @see CanvasApi.zoomToFit()
     */
    zoomToFitRect(paperRect: Rect, options?: ViewportOptions): Promise<void>;
}

/**
 * Event data for `CanvasApi` events.
 *
 * @see CanvasApi
 */
export interface CanvasEvents {
    /**
     * Triggered on [pointer down](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event)
     * event in the canvas.
     */
    pointerDown: CanvasPointerEvent;
    /**
     * Triggered on [pointer move](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointermove_event)
     * event in the canvas.
     */
    pointerMove: CanvasPointerEvent;
    /**
     * Triggered on [pointer up](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerup_event)
     * event in the canvas.
     */
    pointerUp: CanvasPointerUpEvent;
    /**
     * Triggered on [scroll](https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event)
     * event in the canvas.
     */
    scroll: CanvasScrollEvent;
    /**
     * Triggered on [drop](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event)
     * event from a drag and drop operation on the canvas.
     */
    drop: CanvasDropEvent;
    /**
     * Triggered on [contextmenu](https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event/)
     * event (opening a context menu) in the canvas.
     */
    contextMenu: CanvasContextMenuEvent;
    /**
     * Triggered on canvas viewport resize, tracked by a
     * [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).
     */
    resize: CanvasResizeEvent;
    /**
     * Triggered on `isAnimatingGraph()` property change.
     */
    changeAnimatingGraph: PropertyChange<CanvasApi, boolean>;
    /**
     * Triggered on `pointerMode` property change.
     */
    changePointerMode: PropertyChange<CanvasApi, CanvasPointerMode>;
    /**
     * Triggered on `getScale()` property change.
     */
    changeScale: PropertyChange<CanvasApi, number>;
}

/**
 * Event data for canvas pointer events.
 */
export interface CanvasPointerEvent {
    /**
     * Event source (canvas).
     */
    readonly source: CanvasApi;
    /**
     * Original (raw) event data.
     */
    readonly sourceEvent: React.MouseEvent<Element> | MouseEvent;
    /**
     * Pointer event target.
     *
     * If `undefined` then the pointer event target is an empty canvas space.
     */
    readonly target: object | undefined;
    /**
     * `true` if event triggered while viewport is being panned (moved);
     * otherwise `false`.
     */
    readonly panning: boolean;
}

/**
 * Event data for canvas pointer up event.
 */
export interface CanvasPointerUpEvent extends CanvasPointerEvent {
    /**
     * `true` if the pointer up event should be considered as a "click"
     * on the target because it immediately follows pointer down event
     * without any pointer moves in-between.
     */
    readonly triggerAsClick: boolean;
}

/**
 * Event data for canvas scroll event.
 */
export interface CanvasScrollEvent {
    /**
     * Event source (canvas).
     */
    readonly source: CanvasApi;
    /**
     * Original (raw) event data.
     */
    readonly sourceEvent: Event;
}

/**
 * Event data for canvas drop event from a drag and drop operation.
 */
export interface CanvasDropEvent {
    /**
     * Event source (canvas).
     */
    readonly source: CanvasApi;
    /**
     * Original (raw) event data.
     */
    readonly sourceEvent: DragEvent;
    /**
     * Position of the drop in paper coordinates.
     */
    readonly position: Vector;
}

/**
 * Event data for canvas context menu open request event.
 */
export interface CanvasContextMenuEvent {
    /**
     * Event source (canvas).
     */
    readonly source: CanvasApi;
    /**
     * Original (raw) event data.
     */
    readonly sourceEvent: React.MouseEvent;
    /**
     * Pointer event target.
     *
     * If `undefined` then the pointer event target is an empty canvas space.
     */
    readonly target: object | undefined;
}

/**
 * Event data for canvas viewport resize event.
 */
export interface CanvasResizeEvent {
    /**
     * Event source (canvas).
     */
    readonly source: CanvasApi;
}

/**
 * Represents canvas viewport size and transformation.
 *
 * Allows to convert between different canvas coordinate types.
 */
export interface CanvasMetrics {
    /**
     * Sizes and offsets for the canvas area DOM element.
     */
    readonly area: CanvasAreaMetrics;
    /**
     * Returns transformation data between paper and scrollable pane coordinates.
     */
    getTransform(): PaperTransform;
    /**
     * Returns a immutable instance of this metrics which is guaranteed to
     * never change even if original canvas viewport changes.
     */
    snapshot(): CanvasMetrics;
    /**
     * Returns paper size in paper coordinates.
     */
    getPaperSize(): Size;
    /**
     * Returns viewport bounds in page coordinates.
     */
    getViewportPageRect(): Rect;
    /**
     * Translates page to paper coordinates.
     */
    pageToPaperCoords(pageX: number, pageY: number): Vector;
    /**
     * Translates paper to page coordinates.
     */
    paperToPageCoords(paperX: number, paperY: number): Vector;
    /**
     * Translates client (viewport) to paper coordinates.
     */
    clientToPaperCoords(areaClientX: number, areaClientY: number): Vector;
    /**
     * Translates client (viewport) to scrollable pane coordinates.
     */
    clientToScrollablePaneCoords(areaClientX: number, areaClientY: number): Vector;
    /**
     * Translates scrollable pane to client (viewport) coordinates.
     */
    scrollablePaneToClientCoords(paneX: number, paneY: number): Vector;
    /**
     * Translates scrollable pane to paper coordinates.
     */
    scrollablePaneToPaperCoords(paneX: number, paneY: number): Vector;
    /**
     * Translates paper to scrollable pane coordinates.
     */
    paperToScrollablePaneCoords(paperX: number, paperY: number): Vector;
}

/**
 * Contains sizes and offsets for the canvas area DOM element.
 */
export interface CanvasAreaMetrics {
    /**
     * Canvas area [client width](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth).
     */
    readonly clientWidth: number;
    /**
     * Canvas area [client height](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight).
     */
    readonly clientHeight: number;
    /**
     * Canvas area [offset width](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetWidth).
     */
    readonly offsetWidth: number;
    /**
     * Canvas area [offset height](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight).
     */
    readonly offsetHeight: number;
    /**
     * Canvas area [scroll width](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollWidth).
     */
    readonly scrollLeft: number;
    /**
     * Canvas area [scroll height](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight).
     */
    readonly scrollTop: number;
}

/**
 * Action on moving pointer with pressed main button:
 *   - `panning` - pans the viewport over canvas;
 *   - `selection` - starts selection of the cells on canvas.
 *
 * This mode may be changed to another while `Shift` button is being held
 * (this should be implemented separately when the property value is used
 * in other components).
 */
export type CanvasPointerMode = 'panning' | 'selection';

/**
 * Options for `CanvasApi` methods affecting the viewport.
 */
export interface ViewportOptions {
    /**
     * True if operation should be animated.
     *
     * If duration is provided and greater than zero then defaults to `true`,
     * otherwise it is set to `false`.
     */
    animate?: boolean;
    /**
     * Animation duration in milliseconds.
     *
     * Implicitly sets `animate: true` if greater than zero.
     *
     * @default 500
     */
    duration?: number;
}

/**
 * Options for `CanvasApi.centerTo()` method.
 */
export interface CenterToOptions extends ViewportOptions {
    /**
     * Scale to set when changing the viewport.
     */
    scale?: number;
}

/**
 * Options for `CanvasApi` methods affecting canvas scale.
 */
export interface ScaleOptions extends ViewportOptions {
    /**
     * Scale pivot position in paper coordinates.
     */
    pivot?: Vector;
}

/**
 * Options for the behavior of operation affecting scale on the canvas.
 */
export interface ZoomOptions {
    /**
     * Minimum scale factor.
     *
     * @default 0.2
     */
    min?: number;
    /**
     * Maximum scale factor.
     *
     * @default 2
     */
    max?: number;
    /**
     * Same as `max` but used only for zoom-to-fit to limit the scale factor
     * on small diagrams.
     *
     * @default 1
     */
    maxFit?: number;
    /**
     * Scale step for the zoom-in and zoom-out operations.
     *
     * @default 0.1
     */
    step?: number;
    /**
     * Padding from each viewport border for zoom-to-fit scaling.
     *
     * @default 20
     */
    fitPadding?: number;
    /**
     * Whether `Ctrl`/`Cmd` keyboard key should be held to zoom
     * with the mouse wheel.
     *
     * If `true`, the mouse wheel will be used to scroll viewport
     * horizontally or vertically if `Shift` is held;
     * otherwise the wheel action will be inverted.
     *
     * @default true
     */
    requireCtrl?: boolean;
}

export interface CanvasCellStrategy<Cell> {
    getContentBounds(): Rect;
    getCellFromElement(element: Element): Cell | undefined;
    getCellPosition(cell: Cell): Vector;
    setCellPosition(cell: Cell, position: Vector): void;
    shouldMove(cell: Cell): boolean;
    updateMove(cell: Cell, position: Vector): Cell;
    allowScrollCell(cell: Cell): boolean;
}

export class EmptyCellStrategy<Cell> implements CanvasCellStrategy<Cell> {
  getContentBounds(): Rect {
    return {x: 0, y: 0, width: 0, height: 0};
  }

  getCellFromElement(_element: Element): Cell | undefined {
    return undefined;
  }

  getCellPosition(_cell: Cell): Vector {
    return {x: 0, y: 0};
  }

  setCellPosition(_cell: Cell, _position: Vector): void {
    /* nothing */
  }

  shouldMove(_cell: Cell): boolean {
    return false;
  }

  updateMove(cell: Cell, _position: Vector): Cell {
    return cell;
  }

  allowScrollCell(_cell: Cell): boolean {
    return false;
  }
}
