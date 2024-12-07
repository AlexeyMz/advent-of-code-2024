import { Events, EventObserver, EventSource } from './events';

import { SharedCanvasState } from './sharedCanvasState';

/** @hidden */
export interface RenderingStateOptions {
    shared: SharedCanvasState;
}

/**
 * Event data for `RenderingState` events.
 *
 * @see RenderingState
 */
export interface RenderingStateEvents {
    /**
     * Triggered on a request to synchronously render on a specific layer.
     */
    syncUpdate: {
        /**
         * Target layer to render on.
         */
        readonly layer: RenderingLayer;
    };
}

/**
 * Defines a rendering order which consists of multiple layers.
 *
 * The layers are organized in such way that changes from an earlier layer
 * only affect rendering on the later layers. This way the full rendering
 * could be done by rendering on each layer in order.
 */
export enum RenderingLayer {
    /**
     * Layer to adjust scrollable area for the underlying canvas.
     */
    PaperArea,
}

const FIRST_LAYER = RenderingLayer.PaperArea;
const LAST_LAYER = RenderingLayer.PaperArea;

/**
 * Stores current rendering state for a single canvas.
 *
 * @category Core
 */
export interface RenderingState {
    /**
     * Events for the rendering state.
     */
    readonly events: Events<RenderingStateEvents>;
    /**
     * Shared state for all canvases rendering the same model.
     */
    readonly shared: SharedCanvasState;
    /**
     * Request to synchronously render the canvas, performing any
     * previously deferred updates.
     *
     * This method should be used before reading from the rendering state
     * after any render-impacting change was made to the diagram content.
     *
     * **Example**:
     * ```ts
     * // Add new element to the diagram
     * model.addElement(someElement);
     * // Force synchronous render
     * view.syncUpdate();
     * // Read rendered element size
     * const computedSize = view.getElementSize(someElement);
     * ```
     */
    syncUpdate(): void;
}

export class MutableRenderingState implements RenderingState {
    private readonly listener = new EventObserver();
    private readonly source = new EventSource<RenderingStateEvents>();
    readonly events: Events<RenderingStateEvents> = this.source;

    readonly shared: SharedCanvasState;

    /** @hidden */
    constructor(options: RenderingStateOptions) {
        this.shared = options.shared;
    }

    /** @hidden */
    dispose() {
        this.listener.stopListening();
    }

    syncUpdate() {
        for (let layer = FIRST_LAYER; layer <= LAST_LAYER; layer++) {
            this.source.trigger('syncUpdate', {layer});
        }
    }
}
