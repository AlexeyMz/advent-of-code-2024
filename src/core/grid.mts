export class Grid {
  private readonly data: Uint16Array;

  readonly rows: number;
  readonly columns: number;

  constructor(
    rows: number,
    columns: number,
    data: Uint16Array
  ) {
    this.rows = rows;
    this.columns = columns;
    this.data = data;
  }

  static fromLines(lines: readonly string[]): Grid {
    const rows = lines.length;
    const columns = lines[0].length;
    const data = new Uint16Array(rows * columns);
    let k = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        data[k] = line.charCodeAt(j);
        k++;
      }
    }
    return new Grid(rows, columns, data);
  }

  static empty(rows: number, columns: number, value = 0): Grid {
    const data = new Uint16Array(rows * columns);
    if (value) {
      data.fill(value);
    }
    return new Grid(rows, columns, data);
  }

  get(row: number, column: number): number {
    return this.data[row * this.columns + column];
  }

  getChar(row: number, column: number): string {
    return String.fromCharCode(this.get(row, column));
  }

  tryGet(row: number, column: number, defaultValue: number): number {
    if (row >= 0 && row < this.rows && column >= 0 && column < this.columns) {
      return this.get(row, column);
    }
    return defaultValue;
  }

  tryGetChar(row: number, column: number, defaultValue: string): string {
    if (row >= 0 && row < this.rows && column >= 0 && column < this.columns) {
      return this.getChar(row, column);
    }
    return defaultValue;
  }

  set(row: number, column: number, value: number): void {
    this.data[row * this.columns + column] = value;
  }

  setChar(row: number, column: number, item: string): void {
    this.set(row, column, item.charCodeAt(0));
  }

  trySet(row: number, column: number, value: number): boolean {
    if (row >= 0 && row < this.rows && column >= 0 && column < this.columns) {
      this.set(row, column, value);
      return true;
    }
    return false;
  }

  trySetChar(row: number, column: number, item: string): boolean {
    return this.trySet(row, column, item.charCodeAt(0));
  }

  count(filter: (target: number) => boolean): number {
    let count = 0;
    for (const item of this.data) {
      if (filter(item)) {
        count++;
      }
    }
    return count;
  }

  map(mapper: (value: number) => number): Grid {
    const data = new Uint16Array(this.data.length);
    for (let i = 0; i < data.length; i++) {
      data[i] = mapper(this.data[i]);
    }
    return new Grid(this.rows, this.columns, data);
  }

  clone(): Grid {
    const clonedData = new Uint16Array(this.data);
    return new Grid(this.rows, this.columns, clonedData);
  }

  *enumerateLines(): IterableIterator<string> {
    const {data, columns} = this;
    for (let offset = 0; offset < data.length; offset += columns) {
      const line = data.subarray(offset, offset + this.columns);
      yield String.fromCharCode(...line);
    }
  }

  rotateClockwise(): Grid {
    const {rows, columns} = this;
    const rotated = Grid.empty(columns, rows);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        rotated.set(j, rows - i - 1, this.get(i, j));
      }
    }
    return rotated;
  }
}
