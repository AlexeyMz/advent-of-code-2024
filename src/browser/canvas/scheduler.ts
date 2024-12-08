/**
 * Debounces a function call such that only one is performed if multiple
 * requests are made since initial one for the waiting time.
 *
 * If `timeout` is 'frame', then the timeout is assumed to be up until next
 * rendered frame (via `requestAnimationFrame()`).
 *
 * @category Utilities
 */
export class Debouncer {
    // TODO: fix
    private scheduled: any;

    private _timeout: number | 'frame';
    private callback: (() => void) | undefined;

    constructor(timeout: number | 'frame' = 'frame') {
        this._timeout = timeout;
        this.runSynchronously = this.runSynchronously.bind(this);
    }

    get timeout(): number | 'frame' {
        return this._timeout;
    }

    setTimeout(timeout: number | 'frame'): void {
        this._timeout = timeout;
    }

    call(callback: () => void) {
        this.callback = callback;
        this.schedule();
    }

    private schedule() {
        if (typeof this.scheduled === 'undefined') {
            if (this.timeout === 'frame') {
                this.scheduled = requestAnimationFrame(this.runSynchronously);
            } else {
                this.scheduled = setTimeout(this.runSynchronously, this.timeout);
            }
        }
    }

    private run() {
        const callback = this.callback;
        callback?.();
    }

    runSynchronously() {
        const wasScheduled = this.cancelScheduledTimeout();
        if (wasScheduled) {
            this.run();
        }
    }

    dispose() {
        this.cancelScheduledTimeout();
    }

    private cancelScheduledTimeout(): boolean {
        if (typeof this.scheduled !== 'undefined') {
            if (this.timeout === 'frame') {
                cancelAnimationFrame(this.scheduled);
            } else {
                clearTimeout(this.scheduled);
            }
            this.scheduled = undefined;
            return true;
        }
        return false;
    }
}

/**
 * Runs specified callback on each rendered frame for the `duration` interval
 * using `requestAnimationFrame()`.
 *
 * @category Utilities
 */
export function animateInterval(
    duration: number,
    onProgress: (progress: number) => void,
    signal?: AbortSignal
): Promise<void> {
    return new Promise(resolve => {
        let animationFrameId: number;
        let start: number;
        let cleanupAbort: (() => void) | undefined;

        const animate = (time: number) => {
            if (signal && signal.aborted) { return; }

            start = start || time;
            let timePassed = time - start;
            if (timePassed > duration) { timePassed = duration; }

            onProgress(timePassed / duration);

            if (timePassed < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                cleanupAbort?.();
                resolve();
            }
        };

        if (signal) {
            const onAbort = () => {
                cancelAnimationFrame(animationFrameId);
                cleanupAbort?.();
                resolve();
            };
            cleanupAbort = () => {
                signal.removeEventListener('abort', onAbort);
            };
            signal.addEventListener('abort', onAbort);
        }
        animationFrameId = requestAnimationFrame(animate);
    });
}

export function easeInOutBezier(t: number) {
    if (t < 0) { return 0; }
    if (t > 1) { return 1; }
    return t * t * (3.0 - 2.0 * t);
}
