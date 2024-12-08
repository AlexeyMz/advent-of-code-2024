import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { CanvasHtmlLayer, EmptyCellStrategy, PaperArea, Rect, Size } from '../canvas';

import './day06.css';

function Day06() {
  const [cellStrategy] = React.useState(() => new GridCellStrategy());

  return (
    <PaperArea cellStrategy={cellStrategy}>
      <CanvasHtmlLayer>

      </CanvasHtmlLayer>
    </PaperArea>
  );
}

interface GridCell {

}

class GridCellStrategy extends EmptyCellStrategy<GridCell> {
  private contentSize: Size = {width: 0, height: 0};

  setContentSize(size: Size): void {
    this.contentSize = size;
  }

  override getContentBounds(): Rect {
    const {width, height} = this.contentSize;
    return {x: 0, y: 0, width, height};
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Day06 />
  </React.StrictMode>,
);
