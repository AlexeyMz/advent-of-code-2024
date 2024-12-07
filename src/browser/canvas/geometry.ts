/**
 * Represents a floating-point 2D vector.
 *
 * @category Geometry
 */
export interface Vector {
    readonly x: number;
    readonly y: number;
}

/**
 * Utility functions to operate on 2D vectors.
 *
 * @category Geometry
 */
export namespace Vector {
    /**
     * Adds two vectors component-wise.
     */
    export function add(a: Vector, b: Vector): Vector {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
        };
    }
    /**
     * Subtracts two vectors component-wise.
     */
    export function subtract(a: Vector, b: Vector): Vector {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
        };
    }
    /**
     * Multiplies each vector component by a scalar number.
     */
    export function scale(v: Vector, factor: number): Vector {
        return {x: v.x * factor, y: v.y * factor};
    }
    /**
     * Returns `true` if two vectors are the same, otherwise `false`.
     */
    export function equals(a: Vector, b: Vector): boolean {
        return a.x === b.x && a.y === b.y;
    }
    /**
     * Computes the length of a vector (L2 norm).
     */
    export function length({x, y}: Vector): number {
        return Math.sqrt(x * x + y * y);
    }
    /**
     * Normalizes the vector by dividing by its length to get a unit vector
     * with the same direction as the original one.
     */
    export function normalize({x, y}: Vector): Vector {
        if (x === 0 && y === 0) { return {x, y}; }
        const inverseLength = 1 / Math.sqrt(x * x + y * y);
        return {x: x * inverseLength, y: y * inverseLength};
    }
    /**
     * Computes dot-product of two vectors.
     */
    export function dot({x: x1, y: y1}: Vector, {x: x2, y: y2}: Vector): number {
        return x1 * x2 + y1 * y2;
    }
    /**
     * Computes 2D cross-product of two vectors.
     */
    export function cross2D({x: x1, y: y1}: Vector, {x: x2, y: y2}: Vector): number {
        return x1 * y2 - y1 * x2;
    }
}

/**
 * Represents a 2D rectangular size.
 *
 * @category Geometry
 */
export interface Size {
    readonly width: number;
    readonly height: number;
}

/**
 * Represents a 2D axis-aligned rectangle.
 *
 * @category Geometry
 */
export interface Rect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/**
 * Utility functions to operate on 2D axis-aligned rectangles.
 *
 * @category Geometry
 */
export namespace Rect {
    /**
     * Returns `true` if two rectangles are the same, otherwise `false`.
     */
    export function equals(a: Rect, b: Rect): boolean {
        return (
            a.x === b.x &&
            a.y === b.y &&
            a.width === b.width &&
            a.height === b.height
        );
    }
    /**
     * Computes the center point of a rectangle.
     */
    export function center({x, y, width, height}: Rect): Vector {
        return {x: x + width / 2, y: y + height / 2};
    }
    /**
     * Returns `true` if two rectangles intersects each other, otherwise `false`.
     *
     * Rectangles sharing an edge are considered as intersecting as well.
     */
    export function intersects(a: Rect, b: Rect): boolean {
        return (
            a.x <= (b.x + b.width) &&
            a.y <= (b.y + b.height) &&
            b.x <= (a.x + a.width) &&
            b.y <= (a.y + a.height)
        );
    }
}

function intersectRayFromRectangleCenter(sourceRect: Rect, rayTarget: Vector) {
    const isTargetInsideRect =
        sourceRect.width === 0 || sourceRect.height === 0 ||
        rayTarget.x > sourceRect.x && rayTarget.x < (sourceRect.x + sourceRect.width) &&
        rayTarget.y > sourceRect.y && rayTarget.y < (sourceRect.y + sourceRect.height);

    const halfWidth = sourceRect.width / 2;
    const halfHeight = sourceRect.height / 2;
    const center = {
        x: sourceRect.x + halfWidth,
        y: sourceRect.y + halfHeight,
    };
    if (isTargetInsideRect) {
        return center;
    }

    const direction = Vector.normalize({
        x: rayTarget.x - center.x,
        y: rayTarget.y - center.y,
    });

    const rightDirection = {x: Math.abs(direction.x), y: direction.y};
    const isHorizontal =
        Vector.cross2D({x: halfWidth, y: -halfHeight}, rightDirection) > 0 &&
        Vector.cross2D({x: halfWidth, y: halfHeight}, rightDirection) < 0;

    if (isHorizontal) {
        return {
            x: center.x + halfWidth * Math.sign(direction.x),
            y: center.y + halfWidth * direction.y / Math.abs(direction.x),
        };
    } else {
        return {
            x: center.x + halfHeight * direction.x / Math.abs(direction.y),
            y: center.y + halfHeight * Math.sign(direction.y),
        };
    }
}

/**
 * Returns `true` is two line geometries (vertex sequences) are the same,
 * otherwise `false`.
 *
 * @category Geometry
 */
export function isPolylineEqual(left: ReadonlyArray<Vector>, right: ReadonlyArray<Vector>) {
    if (left === right) { return true; }
    if (left.length !== right.length) { return false; }
    for (let i = 0; i < left.length; i++) {
        const a = left[i];
        const b = right[i];
        if (!(a.x === b.x && a.y === b.y)) {
            return false;
        }
    }
    return true;
}

/**
 * Computes line geometry between two rectangles clipped at each
 * rectangle border with intermediate points in-between.
 *
 * It is assumed that the line starts at source rectangle center,
 * ends at target rectangle center and goes through each vertex in the array.
 *
 * @category Geometry
 */
export function computePolyline(
    sourceRect: Rect,
    targetRect: Rect,
    vertices: ReadonlyArray<Vector>
): Vector[] {
    const startPoint = intersectRayFromRectangleCenter(
        sourceRect, vertices.length > 0 ? vertices[0] : Rect.center(targetRect));
    const endPoint = intersectRayFromRectangleCenter(
        targetRect, vertices.length > 0 ? vertices[vertices.length - 1] : Rect.center(sourceRect));
    return [startPoint, ...vertices, endPoint];
}

/**
 * Computes length of linear line geometry.
 *
 * @category Geometry
 * @see getPointAlongPolyline()
 */
export function computePolylineLength(polyline: ReadonlyArray<Vector>): number {
    let previous: Vector;
    return polyline.reduce((acc, point) => {
        const segmentLength = previous ? Vector.length({x: point.x - previous.x, y: point.y - previous.y}) : 0;
        previous = point;
        return acc + segmentLength;
    }, 0);
}

/**
 * Computes position at the specified `offset` along a linear line geometry
 * relative to the start of the line.
 *
 * If `offset` value is less than 0 or greater than line geometry length,
 * the the first or last point of the line will be returned correspondingly.
 *
 * @category Geometry
 * @see computePolylineLength()
 */
export function getPointAlongPolyline(polyline: ReadonlyArray<Vector>, offset: number): Vector {
    if (polyline.length === 0) {
        throw new Error('Cannot compute a point for an empty polyline');
    }
    if (offset < 0) {
        return polyline[0];
    }
    let currentOffset = 0;
    for (let i = 1; i < polyline.length; i++) {
        const previous = polyline[i - 1];
        const point = polyline[i];
        const segment = {x: point.x - previous.x, y: point.y - previous.y};
        const segmentLength = Vector.length(segment);
        const newOffset = currentOffset + segmentLength;
        if (offset < newOffset) {
            const leftover = (offset - currentOffset) / segmentLength;
            return {
                x: previous.x + leftover * segment.x,
                y: previous.y + leftover * segment.y,
            };
        } else {
            currentOffset = newOffset;
        }
    }
    return polyline[polyline.length - 1];
}

/**
 * Searches for a closest segment of a linear line geometry.
 *
 * @returns index of start point for the closes line segment, or 0 if line is empty.
 * @category Geometry
 * @see getPointAlongPolyline()
 */
export function findNearestSegmentIndex(polyline: ReadonlyArray<Vector>, location: Vector): number {
    let minDistance = Infinity;
    let foundIndex = 0;

    for (let i = 0; i < polyline.length - 1; i++) {
        const pivot = polyline[i];
        const next = polyline[i + 1];

        const target = {x: location.x - pivot.x, y: location.y - pivot.y};
        const segment = {x: next.x - pivot.x, y: next.y - pivot.y};
        const segmentLength = Vector.length(segment);

        const projectionToSegment = Vector.dot(target, segment) / segmentLength;
        if (projectionToSegment < 0 || projectionToSegment > segmentLength) {
            continue;
        }

        const distanceToSegment = Math.abs(Vector.cross2D(target, segment)) / segmentLength;
        if (distanceToSegment < minDistance) {
            minDistance = distanceToSegment;
            foundIndex = i;
        }
    }
    return foundIndex;
}

/**
 * Converts linear line geometry into an SVG path.
 *
 * @category Geometry
 */
export function pathFromPolyline(polyline: ReadonlyArray<Vector>): string {
    return 'M' + polyline.map(({x, y}) => `${x},${y}`).join(' L');
}
