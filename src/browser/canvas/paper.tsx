import * as React from 'react';

import type { CanvasCellStrategy } from './canvasApi';
import { Vector } from './geometry';

export type PaperCell = { readonly paperCellBrand: void };

const CLASS_NAME = 'reactodia-paper';

export function Paper(props: {
    cellStrategy: CanvasCellStrategy<PaperCell>;
    paperTransform: PaperTransform;
    onPointerDown?: (e: React.PointerEvent<HTMLElement>, cell: PaperCell | undefined) => void;
    onContextMenu?: (e: React.MouseEvent<HTMLElement>, cell: PaperCell | undefined) => void;
    onScrollCapture?: (e: React.UIEvent<HTMLElement>, cell: PaperCell | undefined) => void;
    layers: React.ReactNode;
}) {
    const {paperTransform, cellStrategy, onPointerDown, onContextMenu, onScrollCapture, layers} = props;

    const {width, height, scale, paddingX, paddingY} = paperTransform;

    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    // using padding instead of margin in combination with setting width and height
    // on .paper element to avoid "over-constrained" margins, see an explanation here:
    // https://stackoverflow.com/questions/11695354
    const style: React.CSSProperties = {
        width: scaledWidth + paddingX,
        height: scaledHeight + paddingY,
        marginLeft: paddingX,
        marginTop: paddingY,
        paddingRight: paddingX,
        paddingBottom: paddingY,
    };


    const handlePointerDown = onPointerDown ? (e: React.PointerEvent<HTMLDivElement>) => {
        const cell = e.target instanceof Element
            ? findCell(e.target, e.currentTarget, cellStrategy)
            : undefined;
        onPointerDown(e, cell);
    } : undefined;

    const handleContextMenu = onContextMenu ? (e: React.MouseEvent<HTMLDivElement>) => {
        const cell = e.target instanceof Element
            ? findCell(e.target, e.currentTarget, cellStrategy)
            : undefined;
        onContextMenu(e, cell);
    } : undefined;

    const handleScrollCapture = onScrollCapture ? (e: React.UIEvent<HTMLElement>) => {
        const cell = e.target instanceof Element
            ? findCell(e.target, e.currentTarget, cellStrategy)
            : undefined;
        onScrollCapture(e, cell);
    } : undefined;

    return (
        <div className={CLASS_NAME}
            style={style}
            onPointerDown={handlePointerDown}
            onContextMenu={handleContextMenu}
            onScrollCapture={handleScrollCapture}>
            <PaperContext.Provider value={paperTransform}>
                {layers}
            </PaperContext.Provider>
        </div>
    );
}

function findCell(bottom: Element, top: Element, cellStrategy: CanvasCellStrategy<PaperCell>): PaperCell | undefined {
    let target: Node | null = bottom;
    while (true) {
        if (target instanceof Element) {
            const cell = cellStrategy.getCellFromElement(target);
            if (cell) {
                return cell;
            }
        }
        if (!target || target === top) { break; }
        target = target.parentNode;
    }
    return undefined;
}

/**
 * Transformation data between paper and scrollable pane coordinates.
 *
 * @category Geometry
 */
export interface PaperTransform {
    width: number;
    height: number;
    originX: number;
    originY: number;
    scale: number;
    paddingX: number;
    paddingY: number;
}

const PaperContext = React.createContext<PaperTransform | null>(null);

const TRANSFORMED_SVG_CANVAS_STYLE: Readonly<React.CSSProperties> = {
    position: 'absolute',
    top: 0,
    left: 0,
};

/**
 * SVG canvas component to render its children on the diagram in paper coordinate system.
 *
 * @category Components
 */
export function CanvasSvgLayer(props: {
    svgProps?: React.HTMLProps<SVGSVGElement>;
    children: React.ReactNode;
}) {
    const {svgProps, children} = props;
    const paperTransform = React.useContext(PaperContext);
    if (!paperTransform) {
        throw new Error('Cannot render canvas SVG layer outside a canvas');
    }

    const {width, height, originX, originY, scale} = paperTransform;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    let svgStyle = TRANSFORMED_SVG_CANVAS_STYLE;
    if (svgProps?.style) {
        svgStyle = {...svgStyle, ...svgProps?.style};
    }
    return (
        <svg {...svgProps}
            width={scaledWidth}
            height={scaledHeight}
            style={svgStyle}>
            {svgProps?.children}
            <g transform={`scale(${scale},${scale})translate(${originX},${originY})`}>
                {children}
            </g>
        </svg>
    );
}

export function CanvasHtmlLayer(props: {
    htmlProps?: React.HTMLProps<HTMLDivElement>;
    children: React.ReactNode;
}) {
    const {htmlProps, children} = props;
    const paperTransform = React.useContext(PaperContext);
    if (!paperTransform) {
        throw new Error('Cannot render canvas HTML layer outside a canvas');
    }

    const {originX, originY, scale} = paperTransform;
    const htmlStyle: React.CSSProperties = {
        ...htmlProps?.style,
        position: 'absolute', left: 0, top: 0,
        transform: `scale(${scale},${scale})translate(${originX}px,${originY}px)`,
    };
    return (
        <div {...htmlProps} style={htmlStyle}>
            {children}
        </div>
    );
}

/**
 * @returns scrollable pane size in non-scaled pane coords.
 *
 * @category Geometry
 */
export function totalPaneSize(pt: PaperTransform): Vector {
    return {
        x: pt.width * pt.scale + pt.paddingX * 2,
        y: pt.height * pt.scale + pt.paddingY * 2,
    };
}

/**
 * @returns scrollable pane top-left corner position in non-scaled pane coords.
 *
 * @category Geometry
 */
export function paneTopLeft(pt: PaperTransform): Vector {
    return {x: -pt.paddingX, y: -pt.paddingY};
}

/**
 * Translates paper to scrollable pane coordinates.
 *
 * @category Geometry
 */
export function paneFromPaperCoords(paper: Vector, pt: PaperTransform): Vector {
    return {
        x: (paper.x + pt.originX) * pt.scale,
        y: (paper.y + pt.originY) * pt.scale,
    };
}

/**
 * Translates scrollable pane to paper coordinates.
 *
 * @category Geometry
 */
export function paperFromPaneCoords(pane: Vector, pt: PaperTransform): Vector {
    return {
        x: pane.x / pt.scale - pt.originX,
        y: pane.y / pt.scale - pt.originY,
    };
}
