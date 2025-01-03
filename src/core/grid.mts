abstract class BaseGrid<T, Self extends BaseGrid<T, Self>> {
  readonly rows: number;
  readonly columns: number;
  readonly data: Uint16Array;

  constructor(
    rows: number,
    columns: number,
    data: Uint16Array
  ) {
    this.rows = rows;
    this.columns = columns;
    this.data = data;
  }

  protected abstract create(
    rows: number,
    columns: number,
    data: Uint16Array
  ): Self;

  protected abstract wrap(value: T): number;
  protected abstract unwrap(num: number): T;

  valid(row: number, column: number): boolean {
    return row >= 0 && row < this.rows && column >= 0 && column < this.columns;
  }

  get(row: number, column: number): T {
    if (!(row >= 0 && row < this.rows && column >= 0 && column < this.columns)) {
      throw new Error('Grid: trying to get out of bounds');
    }
    return this.unwrap(this.data[row * this.columns + column]);
  }

  tryGet(row: number, column: number, defaultValue: T): T {
    if (row >= 0 && row < this.rows && column >= 0 && column < this.columns) {
      return this.get(row, column);
    }
    return defaultValue;
  }

  set(row: number, column: number, value: T): void {
    if (!(row >= 0 && row < this.rows && column >= 0 && column < this.columns)) {
      throw new Error('Grid: trying to set out of bounds');
    }
    this.data[row * this.columns + column] = this.wrap(value);
  }

  trySet(row: number, column: number, value: T): boolean {
    if (row >= 0 && row < this.rows && column >= 0 && column < this.columns) {
      this.set(row, column, value);
      return true;
    }
    return false;
  }

  fill(value: T): void {
    this.data.fill(this.wrap(value));
  }

  fillFrom<U>(
    other: BaseGrid<U, any>,
    mapper: (value: U) => T
  ): void {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = this.wrap(mapper(other.unwrap(other.data[i])));
    }
  }

  count(filter: (value: T) => boolean): number {
    let count = 0;
    for (const item of this.data) {
      if (filter(this.unwrap(item))) {
        count++;
      }
    }
    return count;
  }

  joinFrom(other: Self, joiner: (a: T, b: T) => T): void {
    if (this.data.length !== other.data.length) {
      throw new Error('Incompatible data length to join');
    }
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = this.wrap(
        joiner(this.unwrap(this.data[i]), this.unwrap(other.data[i]))
      );
    }
  }

  clone(): Self {
    const clonedData = new Uint16Array(this.data);
    return this.create(this.rows, this.columns, clonedData);
  }

  rotateClockwise(): Self {
    const {rows, columns} = this;
    const rotated = this.create(rows, columns, new Uint16Array(this.data.length));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        rotated.set(j, rows - i - 1, this.get(i, j));
      }
    }
    return rotated;
  }
}

export class NumericGrid extends BaseGrid<number, NumericGrid> {
  static empty(rows: number, columns: number, value?: number): NumericGrid {
    const data = new Uint16Array(rows * columns);
    if (value) {
      data.fill(value);
    }
    return new NumericGrid(rows, columns, data);
  }

  static from<T>(other: BaseGrid<T, any>, mapper: (value: T) => number): NumericGrid {
    const grid = NumericGrid.empty(other.rows, other.columns);
    grid.fillFrom(other, mapper);
    return grid;
  }

  override create(rows: number, columns: number, data: Uint16Array): NumericGrid {
    return new NumericGrid(rows, columns, data);
  }

  override wrap(value: number): number {
    return value;
  }

  override unwrap(num: number): number {
    return num;
  }
}

export class CharGrid extends BaseGrid<string, CharGrid> {
  static empty(rows: number, columns: number, value: string): CharGrid {
    const data = new Uint16Array(rows * columns);
    data.fill(value.charCodeAt(0));
    return new CharGrid(rows, columns, data);
  }

  static from<T>(other: BaseGrid<T, any>, mapper: (value: T) => string): CharGrid {
    const grid = CharGrid.empty(other.rows, other.columns, '\0');
    grid.fillFrom(other, mapper);
    return grid;
  }

  static fromLines(lines: readonly string[]): CharGrid {
    const rows = lines.length;
    const columns = lines[0].length;
    const data = new Uint16Array(rows * columns);
    let k = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length !== columns) {
        throw new Error('Grid: inconsistent line length');
      }
      for (let j = 0; j < line.length; j++) {
        data[k] = line.charCodeAt(j);
        k++;
      }
    }
    return new CharGrid(rows, columns, data);
  }

  override create(rows: number, columns: number, data: Uint16Array): CharGrid {
    return new CharGrid(rows, columns, data);
  }

  override wrap(value: string): number {
    return value.charCodeAt(0);
  }

  override unwrap(num: number): string {
    return String.fromCharCode(num);
  }

  *lines(): IterableIterator<string> {
    const {data, columns} = this;
    for (let offset = 0; offset < data.length; offset += columns) {
      const line = data.subarray(offset, offset + this.columns);
      yield String.fromCharCode(...line) + '\n';
    }
  }
}
